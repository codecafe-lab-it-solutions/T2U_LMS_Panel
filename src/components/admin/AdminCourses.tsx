import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { BookOpen, Edit2, Trash2, Plus, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminCourses() {
  const { courses, createCourse, updateCourse, deleteCourse, assignments, gradeAssignment } = useAppStore();
  const [published, setPublished] = useState<Set<string>>(new Set(courses.map(c => c.id)));
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', category: 'Gig Economy', duration: '2 Hours', thumbnail: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=600' });
  const [gradeFor, setGradeFor] = useState<string | null>(null);
  const [gradeInput, setGradeInput] = useState('A+');
  const [gradeFeedback, setGradeFeedback] = useState('');

  const togglePublish = (id: string) => setPublished(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const openCreate = () => {
    setEditingId(null);
    setForm({ title: '', description: '', category: 'Gig Economy', duration: '2 Hours', thumbnail: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=600' });
    setShowModal(true);
  };

  const openEdit = (c: any) => {
    setEditingId(c.id);
    setForm({ title: c.title, description: c.description, category: c.category, duration: c.duration, thumbnail: c.thumbnail });
    setShowModal(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const course = courses.find(c => c.id === editingId)!;
      updateCourse({ ...course, ...form });
    } else {
      createCourse({ ...form, featured: true, courseStatus: 'new', instructor: 'Admin', modulesCount: 1, chapters: [], quizzes: [] });
    }
    setShowModal(false);
  };

  const submissions = assignments.filter(a => a.status === 'Submitted');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Course Management</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Manage all platform courses and assignment submissions</p>
      </div>

      {/* Courses */}
      <Card className="border border-border bg-card">
        <CardHeader className="border-b border-border/40 pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" /> All Courses ({courses.length})
            </CardTitle>
            <CardDescription className="text-xs">Publish/unpublish courses and manage content</CardDescription>
          </div>
          <Button onClick={openCreate} size="sm" className="h-8 text-xs bg-primary text-white font-bold">
            <Plus className="w-3.5 h-3.5 mr-1" />Add Course
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20">
                  {['Course', 'Category', 'Duration', 'Instructor', 'Enrollments', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[9px] font-bold text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {courses.map(c => (
                  <tr key={c.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img src={c.thumbnail} alt={c.title} className="w-10 h-7 rounded object-cover shrink-0" />
                        <p className="font-bold text-foreground max-w-[160px] truncate">{c.title}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">{c.category}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.duration}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.instructor}</td>
                    <td className="px-4 py-3 font-mono text-foreground">{c.id === 'C101' ? 84 : c.id === 'C102' ? 61 : Math.floor(Math.random() * 50 + 10)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${published.has(c.id) ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 bg-slate-700'}`}>
                        {published.has(c.id) ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <Button size="sm" onClick={() => togglePublish(c.id)}
                          className={`h-6 text-[9px] font-bold px-2 ${published.has(c.id) ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20'}`}>
                          {published.has(c.id) ? <><EyeOff className="w-3 h-3 mr-1" />Unpublish</> : <><Eye className="w-3 h-3 mr-1" />Publish</>}
                        </Button>
                        <Button size="sm" onClick={() => openEdit(c)} className="h-6 text-[9px] font-bold px-2 bg-muted/40 text-foreground border border-border hover:bg-muted">
                          <Edit2 className="w-3 h-3 mr-1" />Edit
                        </Button>
                        <Button size="sm" onClick={() => { if (confirm('Delete this course?')) deleteCourse(c.id); }}
                          className="h-6 text-[9px] font-bold px-2 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pending Submissions */}
      <Card className="border border-border bg-card">
        <CardHeader className="border-b border-border/40 pb-3">
          <CardTitle className="text-sm font-bold">Pending Assignment Submissions ({submissions.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {submissions.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">No pending submissions</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20">
                    {['Student', 'Assignment', 'Course', 'File', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[9px] font-bold text-muted-foreground uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {submissions.map(sub => (
                    <tr key={sub.id} className="border-b border-border/20 hover:bg-muted/10">
                      <td className="px-4 py-3 font-bold text-foreground">{sub.studentName || 'Student'}</td>
                      <td className="px-4 py-3 text-foreground">{sub.title}</td>
                      <td className="px-4 py-3 text-muted-foreground">{sub.course}</td>
                      <td className="px-4 py-3 text-primary font-mono text-[10px]">{sub.submissionFile}</td>
                      <td className="px-4 py-3">
                        {gradeFor === sub.id ? (
                          <div className="flex items-center gap-2">
                            <input value={gradeInput} onChange={e => setGradeInput(e.target.value)} placeholder="Grade" className="h-7 w-16 px-2 rounded border border-border bg-muted/20 text-xs font-mono" />
                            <input value={gradeFeedback} onChange={e => setGradeFeedback(e.target.value)} placeholder="Feedback..." className="h-7 w-32 px-2 rounded border border-border bg-muted/20 text-xs" />
                            <Button size="sm" onClick={() => { gradeAssignment(sub.id, gradeInput, gradeFeedback); setGradeFor(null); }}
                              className="h-7 text-[9px] font-bold px-2 bg-emerald-500 text-white">
                              <CheckCircle2 className="w-3 h-3 mr-1" />Grade
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setGradeFor(null)} className="h-7 text-[9px] border-border">Cancel</Button>
                          </div>
                        ) : (
                          <Button size="sm" onClick={() => { setGradeFor(sub.id); setGradeInput('A+'); setGradeFeedback(''); }}
                            className="h-6 text-[9px] font-bold px-2 bg-primary text-white">Grade</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Course modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <Card className="max-w-md w-full border border-border bg-card shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-600 via-primary to-orange-500" />
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-xs font-extrabold uppercase">{editingId ? 'Edit Course' : 'Create Course'}</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={submit} className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-[9px] font-bold uppercase text-muted-foreground">Course Title</Label>
                  <Input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="h-9 text-xs bg-muted/20" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] font-bold uppercase text-muted-foreground">Description</Label>
                  <textarea required rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full p-2 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold uppercase text-muted-foreground">Category</Label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      className="w-full h-9 px-2 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none">
                      <option>Gig Economy</option><option>Blockchain</option><option>Artificial Intelligence</option><option>Spoken English</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold uppercase text-muted-foreground">Duration</Label>
                    <Input required value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} className="h-9 text-xs bg-muted/20" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="h-8 text-xs border-border">Cancel</Button>
                  <Button type="submit" className="h-8 text-xs bg-primary text-white font-bold px-5">{editingId ? 'Save' : 'Create'}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
