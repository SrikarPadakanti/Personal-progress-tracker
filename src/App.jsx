import React, { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function SrikarSDEPrepTracker() {
  const STORAGE_KEY = "sde_prep_tracker_v1";
  const PROFILE_KEY = "sde_prep_profile_v1";

  const genId = (prefix = "id") => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

  const defaultSections = [
    {
      id: "dsa",
      title: "DSA / Algorithms",
      color: "from-purple-500 to-indigo-500",
      topics: [
        {
          id: genId("t"),
          title: "Arrays & Strings",
          status: "todo",
          notes: "",
          subtopics: [
            { id: genId("s"), title: "Two pointers & sliding window", status: "todo", notes: "" },
            { id: genId("s"), title: "String parsing & pattern match", status: "todo", notes: "" }
          ]
        }
      ]
    },
    {
      id: "java",
      title: "Java & Backend",
      color: "from-green-400 to-teal-500",
      topics: [
        {
          id: genId("t"),
          title: "Core OOP & Collections",
          status: "todo",
          notes: "",
          subtopics: [{ id: genId("s"), title: "Collections deep-dive", status: "todo", notes: "" }]
        }
      ]
    }
  ];

  // Load sections from localStorage or use defaults
  const [sections, setSections] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : defaultSections;
      // normalize: ensure topics & subtopics arrays exist
      return parsed.map((sec) => ({
        ...sec,
        topics: (sec.topics || []).map((t) => ({ ...t, subtopics: t.subtopics || [], status: t.status || "todo", notes: t.notes || "" }))
      }));
    } catch (e) {
      return defaultSections;
    }
  });

  // selectedSection: default to first section if present
  const [selectedSection, setSelectedSection] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const init = raw ? JSON.parse(raw) : null;
      if (init && init.length) return init[0].id;
      return defaultSections[0].id;
    } catch (e) {
      return defaultSections[0].id;
    }
  });

  // Keep selectedSection valid if sections change
  useEffect(() => {
    if (!sections.find((s) => s.id === selectedSection)) {
      setSelectedSection(sections[0]?.id || null);
    }
  }, [sections, selectedSection]);

  const [profile, setProfile] = useState(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      return raw
        ? JSON.parse(raw)
        : { name: "Srikar", picture: "", links: { github: "", linkedin: "", leetcode: "", gfg: "" } };
    } catch (e) {
      return { name: "Srikar", picture: "", links: { github: "", linkedin: "", leetcode: "", gfg: "" } };
    }
  });

  // persist
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
  }, [sections]);
  useEffect(() => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }, [profile]);

  // Progress calculations (safe checks)
  const sectionProgress = (section) => {
    const topicsCount = (section?.topics || []).length;
    if (!topicsCount) return 0;
    let score = 0;
    (section.topics || []).forEach((t) => {
      score += t.status === "done" ? 1 : t.status === "revise" ? 0.4 : 0;
      if (t.subtopics && t.subtopics.length) {
        const subDone = t.subtopics.filter((s) => s.status === "done").length;
        score += (subDone / t.subtopics.length) * 0.5;
      }
    });
    const maxScore = topicsCount * 1.5;
    return Math.round((score / maxScore) * 100);
  };

  const overallProgress = () => {
    const totalTopics = sections.reduce((acc, s) => acc + (s.topics || []).length, 0);
    if (!totalTopics) return 0;
    const score = sections.reduce((acc, s) => {
      let sec = 0;
      (s.topics || []).forEach((t) => {
        sec += t.status === "done" ? 1 : t.status === "revise" ? 0.4 : 0;
        if (t.subtopics && t.subtopics.length) {
          const subDone = t.subtopics.filter((x) => x.status === "done").length;
          sec += (subDone / t.subtopics.length) * 0.5;
        }
      });
      return acc + sec;
    }, 0);
    const maxScore = totalTopics * 1.5;
    return Math.round((score / maxScore) * 100);
  };

  // status cycle
  const nextStatus = (current) => (current === "todo" ? "done" : current === "done" ? "revise" : "todo");

  const toggleTopicStatus = (sectionId, topicId) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, topics: (s.topics || []).map((t) => (t.id === topicId ? { ...t, status: nextStatus(t.status || "todo") } : t)) }
          : s
      )
    );
  };

  const toggleSubStatus = (sectionId, topicId, subId) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          topics: (s.topics || []).map((t) => {
            if (t.id !== topicId) return t;
            // if subtopics missing, ensure array exists
            const subs = t.subtopics || [];
            return { ...t, subtopics: subs.map((sub) => (sub.id === subId ? { ...sub, status: nextStatus(sub.status || "todo") } : sub)) };
          })
        };
      })
    );
  };

  const updateTopicNotes = (sectionId, topicId, notes) =>
    setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, topics: (s.topics || []).map((t) => (t.id === topicId ? { ...t, notes } : t)) } : s)));

  const updateSubNotes = (sectionId, topicId, subId, notes) =>
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        return { ...s, topics: (s.topics || []).map((t) => (t.id === topicId ? { ...t, subtopics: (t.subtopics || []).map((sub) => (sub.id === subId ? { ...sub, notes } : sub)) } : t)) };
      })
    );

  const addSubtopic = (sectionId, topicId, title) => {
    if (!title || !title.trim()) return;
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          topics: (s.topics || []).map((t) => (t.id === topicId ? { ...t, subtopics: [...(t.subtopics || []), { id: genId("s"), title: title.trim(), status: "todo", notes: "" }] } : t))
        };
      })
    );
  };

  const addTopic = (sectionId, title) => {
    if (!title || !title.trim()) return;
    setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, topics: [...(s.topics || []), { id: genId("t"), title: title.trim(), status: "todo", notes: "", subtopics: [] }] } : s)));
  };

  const addSection = (title) => {
    if (!title || !title.trim()) return;
    const newSec = { id: genId("sec"), title: title.trim(), color: "from-indigo-400 to-indigo-600", topics: [] };
    setSections((prev) => [...prev, newSec]);
    setSelectedSection(newSec.id);
  };

  const removeTopic = (sectionId, topicId) => {
    if (!confirm("Remove topic?")) return;
    setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, topics: (s.topics || []).filter((t) => t.id !== topicId) } : s)));
  };

  const renameTopic = (sectionId, topicId, newTitle) => {
    setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, topics: (s.topics || []).map((t) => (t.id === topicId ? { ...t, title: newTitle } : t)) } : s)));
  };

  // handle drag & drop (reorder topics within a section)
  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;
    const sectionId = source.droppableId.split("::")[1];
    const secDestId = destination.droppableId.split("::")[1];
    if (sectionId !== secDestId) return;
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        const items = Array.from(s.topics || []);
        const [moved] = items.splice(source.index, 1);
        items.splice(destination.index, 0, moved);
        return { ...s, topics: items };
      })
    );
  };

  const updateProfileField = (field, value) => setProfile((p) => ({ ...p, [field]: value }));
  const updateProfileLink = (key, value) => setProfile((p) => ({ ...p, links: { ...p.links, [key]: value } }));

  // UI state for modal
  const [modal, setModal] = useState({ open: false, mode: "topic", sectionId: null, topicId: null });
  const [modalInput, setModalInput] = useState("");

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black via-zinc-900 to-slate-900 text-white">
      <header className="w-full px-4 md:px-8 mb-6 mt-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Srikar's Progress Tracker</h1>
            <p className="text-sm text-zinc-300">Personal progress tracker for SDE prep.</p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setModal({ open: true, mode: "section" })} className="px-3 py-2 rounded-md bg-indigo-600">+ New Section</button>
          </div>
        </div>

        <div className="mt-4 flex flex-col md:flex-row items-center gap-4">
          <div className="w-full md:w-2/3">
            <div className="p-4 rounded-2xl bg-zinc-900/60">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm text-zinc-300">Overall Progress</h3>
                  <div className="mt-2 w-full bg-white/5 rounded-full h-4 overflow-hidden relative">
                    <div className="absolute inset-0 flex items-center pl-3">
                      <div className="text-xs font-medium text-white/90">{overallProgress()}%</div>
                    </div>
                    <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${overallProgress()}%`, background: 'linear-gradient(90deg,#7c3aed,#06b6d4)', boxShadow: '0 0 18px rgba(124,58,237,0.6)' }}></div>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-4">
                  <div className="text-xs text-zinc-400">Legend</div>
                  <div className="text-xs flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-400 block" /> Done</div>
                  <div className="text-xs flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-400 block" /> Revise</div>
                  <div className="text-xs flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-zinc-700 block" /> Todo</div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full md:w-1/3">
            <div className="p-4 rounded-2xl bg-gradient-to-tr from-zinc-800/40 to-zinc-900/40 border border-zinc-700">
              <h4 className="text-sm text-zinc-300">Profile</h4>
              <div className="mt-3 flex items-center gap-3">
                <img src={profile.picture || "https://via.placeholder.com/80"} alt="profile" className="w-16 h-16 rounded-md object-cover" />
                <div className="flex-1">
                  <input value={profile.name} onChange={(e) => updateProfileField("name", e.target.value)} className="w-full p-2 rounded-md bg-zinc-800 text-sm" />
                  <input value={profile.picture} onChange={(e) => updateProfileField("picture", e.target.value)} placeholder="Picture URL" className="mt-2 w-full p-2 rounded-md bg-zinc-800 text-sm" />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2">
                <input value={profile.links.github} onChange={(e) => updateProfileLink("github", e.target.value)} placeholder="GitHub URL" className="p-2 rounded-md bg-zinc-800 text-sm" />
                <input value={profile.links.linkedin} onChange={(e) => updateProfileLink("linkedin", e.target.value)} placeholder="LinkedIn URL" className="p-2 rounded-md bg-zinc-800 text-sm" />
                <input value={profile.links.leetcode} onChange={(e) => updateProfileLink("leetcode", e.target.value)} placeholder="LeetCode / GFG URL" className="p-2 rounded-md bg-zinc-800 text-sm" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-screen min-h-screen grid grid-cols-1 md:grid-cols-4 gap-6">
        <aside className="md:col-span-1 w-full bg-zinc-900/50 p-4 rounded-2xl md:sticky top-6 h-max">
          <div className="mb-4">
            <input placeholder="Search topics..." className="w-full p-2 rounded-md bg-zinc-800 text-sm" onChange={() => {}} />
          </div>

          <div className="flex flex-col gap-2">
            {sections.map((s) => (
              <button key={s.id} onClick={() => setSelectedSection(s.id)} className={`text-left p-3 rounded-xl hover:bg-zinc-800 transition ${selectedSection === s.id ? "ring-2 ring-offset-2 ring-indigo-500" : ""}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">{s.title}</div>
                    <div className="text-xs text-zinc-400">{(s.topics || []).length} topics</div>
                  </div>
                  <div className="w-20">
                    <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
                      <div style={{ width: `${sectionProgress(s)}%`, background: "linear-gradient(90deg,#f59e0b,#ef4444)", boxShadow: "0 0 12px rgba(239,68,68,0.35)" }} className="h-full rounded-full transition-all"></div>
                    </div>
                  </div>
                </div>
              </button>
            ))}

            <div className="mt-3 border-t border-zinc-800 pt-3">
              <button onClick={() => setModal({ open: true, mode: "section" })} className="w-full p-2 rounded-md bg-indigo-600">+ New Section</button>
            </div>
          </div>
        </aside>

        <section className="w-full min-h-screen md:col-span-3 w-full overflow-auto">
          <div className="mb-4 text-sm text-zinc-400">Drag to reorder</div>

          <DragDropContext onDragEnd={onDragEnd}>
            {(sections.filter((s) => s.id === selectedSection) || []).map((s) => (
              <Droppable key={s.id} droppableId={`topics::${s.id}`}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="p-4 rounded-2xl bg-zinc-900/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold">{s.title}</h2>
                        <div className="text-sm text-zinc-400">Progress: {sectionProgress(s)}%</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-xs text-zinc-300">Topics: {(s.topics || []).length}</div>
                        <button onClick={() => setModal({ open: true, mode: "topic", sectionId: s.id })} className="px-3 py-2 rounded-md bg-gradient-to-r from-indigo-500 to-pink-500 shadow-glow">+ Topic</button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3">
                      {(s.topics || []).map((topic, index) => (
                        <Draggable key={topic.id} draggableId={topic.id} index={index}>
                          {(prov) => (
                            <div ref={prov.innerRef} {...prov.draggableProps} style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))", padding: 12, borderRadius: 12, ...prov.draggableProps.style }}>
                              <div className="flex items-start gap-3 justify-between">
                                <div className="flex items-start gap-3">
                                  <div {...prov.dragHandleProps} className="cursor-grab p-2 rounded-md bg-zinc-800 text-zinc-300">≡</div>
                                  <button onClick={() => toggleTopicStatus(s.id, topic.id)} className={`w-10 h-10 rounded-full flex items-center justify-center ${topic.status === "done" ? "bg-green-400 text-black" : topic.status === "revise" ? "bg-yellow-400 text-black" : "bg-zinc-700 text-zinc-200"}`}>
                                    {topic.status === "done" ? "✓" : topic.status === "revise" ? "!" : ""}
                                  </button>

                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-semibold">{topic.title}</h3>
                                      <div className="text-xs text-zinc-400">({topic.status})</div>
                                    </div>
                                    <div className="text-xs text-zinc-400 mt-1">{topic.notes || <span className="text-zinc-600">No notes — add comments</span>}</div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button onClick={() => { const t = prompt("Rename topic", topic.title); if (t !== null) renameTopic(s.id, topic.id, t); }} className="px-3 py-2 bg-zinc-700 rounded-md text-sm">Rename</button>
                                  <button onClick={() => { if (confirm("Delete topic?")) removeTopic(s.id, topic.id); }} className="px-3 py-2 bg-red-600/80 rounded-md text-sm">Delete</button>
                                </div>
                              </div>

                              {/* Subtopics */}
                              <div className="mt-3">
                                <div className="text-sm text-zinc-400 mb-2">Subtopics</div>
                                <div className="grid gap-2">
                                  {(topic.subtopics || []).map((sub) => (
                                    <div key={sub.id} className="p-3 rounded-lg bg-zinc-800/30 flex gap-2 items-start">
                                      <button onClick={() => toggleSubStatus(s.id, topic.id, sub.id)} className={`w-8 h-8 rounded-full flex items-center justify-center ${sub.status === "done" ? "bg-green-400 text-black" : sub.status === "revise" ? "bg-yellow-400 text-black" : "bg-zinc-700 text-zinc-200"}`}>
                                        {sub.status === "done" ? "✓" : sub.status === "revise" ? "!" : ""}
                                      </button>

                                      <div style={{ flex: 1 }}>
                                        <div className="flex items-center justify-between">
                                          <div className="font-medium">{sub.title}</div>
                                          <div className="text-xs text-zinc-400">({sub.status})</div>
                                        </div>
                                        <textarea value={sub.notes} onChange={(e) => updateSubNotes(s.id, topic.id, sub.id, e.target.value)} placeholder="Subtopic notes" className="mt-2 p-2 rounded-md bg-zinc-800 text-sm w-full" />
                                      </div>
                                    </div>
                                  ))}

                                  <div className="flex gap-2">
                                    <input id={`add-sub-${topic.id}`} placeholder="Add subtopic" className="flex-1 p-2 rounded-md bg-zinc-800 text-sm" />
                                    <button onClick={() => { const el = document.getElementById(`add-sub-${topic.id}`); if (el && el.value && el.value.trim()) { addSubtopic(s.id, topic.id, el.value); el.value = ""; } }} className="px-3 py-2 rounded-md bg-emerald-500 text-black">Add</button>
                                  </div>
                                </div>
                              </div>

                              {/* Topic notes */}
                              <div className="mt-3">
                                <div className="text-sm text-zinc-400 mb-1">Topic notes</div>
                                <textarea value={topic.notes} onChange={(e) => updateTopicNotes(s.id, topic.id, e.target.value)} placeholder="Add notes, links or commands here" className="p-2 rounded-md bg-zinc-800 text-sm w-full" />
                              </div>

                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </DragDropContext>
        </section>
      </main>

      {/* Modal for adding sections/topics/subtopics */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{modal.mode === "section" ? "Add Section" : modal.mode === "topic" ? "Add Topic" : "Add Subtopic"}</h3>
              <button onClick={() => setModal({ open: false, mode: "topic", sectionId: null, topicId: null })} className="text-zinc-400">Close</button>
            </div>

            <div className="mt-4 grid gap-3">
              {modal.mode === "section" && (
                <div>
                  <input placeholder="Section title" value={modalInput} onChange={(e) => setModalInput(e.target.value)} className="w-full p-2 rounded-md bg-zinc-800" />
                  <div className="mt-2 flex justify-end gap-2">
                    <button onClick={() => { setModal({ open: false, mode: "topic", sectionId: null }); setModalInput(""); }} className="px-3 py-2 bg-zinc-700 rounded-md">Cancel</button>
                    <button onClick={() => { if (modalInput.trim()) { addSection(modalInput.trim()); setModal({ open: false, mode: "topic", sectionId: null }); setModalInput(""); } }} className="px-3 py-2 bg-emerald-500 text-black rounded-md">Add Section</button>
                  </div>
                </div>
              )}

              {modal.mode === "topic" && (
                <div>
                  <select value={modal.sectionId || selectedSection || (sections[0] && sections[0].id)} onChange={(e) => setModal({ ...modal, sectionId: e.target.value })} className="w-full p-2 rounded-md bg-zinc-800">
                    {(sections || []).map((s) => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                  <input placeholder="Topic title" value={modalInput} onChange={(e) => setModalInput(e.target.value)} className="mt-2 w-full p-2 rounded-md bg-zinc-800" />
                  <div className="mt-2 flex justify-end gap-2">
                    <button onClick={() => setModal({ open: false, mode: "topic", sectionId: null })} className="px-3 py-2 bg-zinc-700 rounded-md">Cancel</button>
                    <button onClick={() => { if (modalInput.trim() && modal.sectionId) { addTopic(modal.sectionId, modalInput.trim()); setModal({ open: false, mode: "topic", sectionId: null }); setModalInput(""); } }} className="px-3 py-2 bg-emerald-500 text-black rounded-md">Add Topic</button>
                  </div>
                </div>
              )}

              {modal.mode === "subtopic" && (
                <div>
                  <div className="text-xs text-zinc-400">Section</div>
                  <select value={modal.sectionId || selectedSection} onChange={(e) => setModal({ ...modal, sectionId: e.target.value })} className="w-full p-2 rounded-md bg-zinc-800">
                    {(sections || []).map((s) => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>

                  <div className="text-xs text-zinc-400 mt-2">Topic</div>
                  <select value={modal.topicId || ((sections.find((ss) => ss.id === modal.sectionId) || sections[0])?.topics?.[0]?.id)} onChange={(e) => setModal({ ...modal, topicId: e.target.value })} className="w-full p-2 rounded-md bg-zinc-800 mt-1">
                    {(((sections.find((ss) => ss.id === modal.sectionId) || sections[0])?.topics) || []).map((t) => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>

                  <input placeholder="Subtopic title" value={modalInput} onChange={(e) => setModalInput(e.target.value)} className="mt-2 w-full p-2 rounded-md bg-zinc-800" />
                  <div className="mt-2 flex justify-end gap-2">
                    <button onClick={() => setModal({ open: false, mode: "topic", sectionId: null, topicId: null })} className="px-3 py-2 bg-zinc-700 rounded-md">Cancel</button>
                    <button onClick={() => { if (modalInput.trim() && modal.sectionId && modal.topicId) { addSubtopic(modal.sectionId, modal.topicId, modalInput.trim()); setModal({ open: false, mode: "topic", sectionId: null, topicId: null }); setModalInput(""); } }} className="px-3 py-2 bg-emerald-500 text-black rounded-md">Add Subtopic</button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .shadow-glow { box-shadow: 0 6px 30px rgba(99,102,241,0.12), 0 0 20px rgba(99,102,241,0.08); }
      `}</style>
    </div>
  );
}
