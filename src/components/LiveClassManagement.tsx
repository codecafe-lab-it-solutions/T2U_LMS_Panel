import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { 
  Video, Calendar, Clock, Play, Plus, Trash2, StopCircle, 
  ExternalLink, Sparkles, CheckCircle2, User, RefreshCw, Edit, BarChart2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function LiveClassManagement() {
  const { 
    activeTab, 
    userRole, 
    liveClasses, 
    createLiveClass, 
    startLiveClass, 
    endLiveClass, 
    deleteLiveClass,
    updateLiveClass
  } = useAppStore();

  // Create class dialog
  const [isCreating, setIsCreating] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [courseInput, setCourseInput] = useState('Foundations of Micro-Earning');
  const [topicInput, setTopicInput] = useState('');
  const [dateInput, setDateInput] = useState('Today');
  const [timeInput, setTimeInput] = useState('06:00 PM');
  const [durationInput, setDurationInput] = useState('90 Mins');
  const [linkInput, setLinkInput] = useState('https://zoom.us/j/mock-class');
  const [classSaving, setClassSaving] = useState(false);

  // Edit class dialog state
  const [editingClass, setEditingClass] = useState<any | null>(null);
  const [editTitleInput, setEditTitleInput] = useState('');
  const [editCourseInput, setEditCourseInput] = useState('Foundations of Micro-Earning');
  const [editTopicInput, setEditTopicInput] = useState('');
  const [editDateInput, setEditDateInput] = useState('Today');
  const [editTimeInput, setEditTimeInput] = useState('06:00 PM');
  const [editDurationInput, setEditDurationInput] = useState('90 Mins');
  const [editLinkInput, setEditLinkInput] = useState('https://zoom.us/j/mock-class');

  // End class local input
  const [activeEndingId, setActiveEndingId] = useState<string | null>(null);
  const [recordingLinkInput, setRecordingLinkInput] = useState('https://vimeo.com/mock-recording-stream');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput || !topicInput) return;

    setClassSaving(true);
    setTimeout(() => {
      createLiveClass({
        title: titleInput,
        course: courseInput,
        topic: topicInput,
        instructor: userRole === 'instructor' ? 'Dr. Evelyn Carter' : 'Guest Speaker',
        date: dateInput,
        time: timeInput,
        duration: durationInput,
        meetingLink: linkInput
      });
      setClassSaving(false);
      setIsCreating(false);
      // Reset
      setTitleInput('');
      setTopicInput('');
    }, 1000);
  };

  const handleEndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEndingId) return;

    endLiveClass(activeEndingId, recordingLinkInput);
    setActiveEndingId(null);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;

    updateLiveClass({
      ...editingClass,
      title: editTitleInput,
      course: editCourseInput,
      topic: editTopicInput,
      date: editDateInput,
      time: editTimeInput,
      duration: editDurationInput,
      meetingLink: editLinkInput
    });
    setEditingClass(null);
  };

  // ==========================================
  // RENDER: STUDENT VIEW (`live-classes`)
  // ==========================================
  const renderStudentView = () => (
    <div className="space-y-6">
      
      {/* Dynamic Master Session Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {liveClasses.map((item) => {
          const isLive = item.status === 'LIVE';
          const isCompleted = item.status === 'Completed';

          return (
            <Card 
              key={item.id} 
              className={`border bg-card shadow-lg relative overflow-hidden transition-all duration-300 ${
                isLive 
                  ? 'border-primary/50 shadow-primary/10 ring-2 ring-primary/20 t2u-purple-glow' 
                  : 'border-border/60'
              }`}
            >
              {isLive && (
                <div className="absolute top-0 right-0 bg-rose-500 text-white font-mono text-[9px] font-bold px-3 py-1 uppercase tracking-widest flex items-center gap-1 rounded-bl-xl shadow-xs z-10 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  LIVE NOW
                </div>
              )}

              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-muted-foreground font-mono uppercase bg-muted/40 px-2 py-0.5 rounded-md truncate max-w-[200px]">
                    {item.course}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    ID: {item.id}
                  </span>
                </div>
                <CardTitle className="text-sm font-extrabold text-foreground tracking-tight mt-2 truncate">
                  {item.title}
                </CardTitle>
                <CardDescription className="text-xs font-semibold text-primary truncate">
                  Topic: {item.topic}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-2 text-[10.5px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.time} ({item.duration})</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:col-span-2">
                    <User className="w-3.5 h-3.5 shrink-0" />
                    <span>Instructor: {item.instructor}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/40">
                  {isLive ? (
                    <Button
                      onClick={() => window.open(item.meetingLink, '_blank')}
                      className="w-full text-xs font-extrabold h-9 bg-rose-500 hover:bg-rose-600 text-white animate-pulse flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/10"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      JOIN LIVE ZOOM CLASS
                    </Button>
                  ) : isCompleted ? (
                    <Button
                      onClick={() => window.open(item.recordingLink, '_blank')}
                      className="w-full text-xs font-bold h-9 bg-secondary hover:bg-muted text-primary hover:text-primary border border-border flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-primary" />
                      PLAY RECORDED SESSION
                    </Button>
                  ) : (
                    <Button
                      disabled
                      className="w-full text-xs font-semibold h-9 bg-muted/20 border border-border text-muted-foreground cursor-not-allowed"
                    >
                      Class Scheduled (Starts {item.time})
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

    </div>
  );

  // ==========================================
  // RENDER: INSTRUCTOR VIEW (`live-class-management`)
  // ==========================================
  const renderInstructorView = () => (
    <div className="space-y-6">
      
      {/* Action Header bar */}
      <div className="flex justify-between items-center bg-card border border-border p-4 rounded-2xl shadow-xs">
        <div>
          <span className="text-[10px] text-muted-foreground font-mono uppercase font-bold">Scheduled Classes</span>
          <span className="text-xs font-bold text-foreground block font-sans">Active Webinar Registry</span>
        </div>
        <Button
          id="btn-open-create-class"
          onClick={() => setIsCreating(true)}
          className="text-xs font-bold h-8.5 bg-primary hover:bg-primary/95 text-primary-foreground flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Schedule Live Class
        </Button>
      </div>

      {/* Grid of classes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {liveClasses.map((item) => {
          const isLive = item.status === 'LIVE';
          const isCompleted = item.status === 'Completed';

          return (
            <Card key={item.id} className="border border-border/60 bg-card shadow-md">
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-muted-foreground font-mono uppercase bg-muted/40 px-2 py-0.5 rounded-md truncate max-w-[200px]">
                    {item.course}
                  </span>
                  <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                    isLive ? 'bg-rose-500/10 text-rose-500 border border-rose-500/25 animate-pulse' :
                    isCompleted ? 'bg-muted text-muted-foreground border border-border/40' :
                    'bg-blue-500/10 text-blue-500 border border-blue-500/25'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <CardTitle className="text-sm font-extrabold text-foreground truncate mt-2">
                  {item.title}
                </CardTitle>
                <CardDescription className="text-xs font-semibold text-primary truncate">
                  Topic: {item.topic}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-2 text-[10.5px] text-muted-foreground font-mono">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{item.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{item.time}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/40 flex gap-2">
                  {!isLive && !isCompleted && (
                    <Button
                      id={`btn-start-class-${item.id}`}
                      onClick={() => startLiveClass(item.id)}
                      className="flex-1 text-xs font-bold h-8.5 bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      Start Class
                    </Button>
                  )}

                  {isLive && (
                    <Button
                      id={`btn-end-class-${item.id}`}
                      onClick={() => {
                        setActiveEndingId(item.id);
                        setRecordingLinkInput('https://vimeo.com/recorded_' + item.id.toLowerCase());
                      }}
                      className="flex-1 text-xs font-bold h-8.5 bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center gap-1.5 animate-pulse"
                    >
                      <StopCircle className="w-3.5 h-3.5" />
                      End Session
                    </Button>
                  )}

                  {isCompleted && (
                    <Button
                      disabled
                      className="flex-1 text-xs font-semibold h-8.5 bg-muted/20 border border-border text-muted-foreground cursor-not-allowed"
                    >
                      Session Archived
                    </Button>
                  )}

                  <Button
                    id={`btn-edit-class-${item.id}`}
                    onClick={() => {
                      setEditingClass(item);
                      setEditTitleInput(item.title);
                      setEditCourseInput(item.course);
                      setEditTopicInput(item.topic);
                      setEditDateInput(item.date);
                      setEditTimeInput(item.time);
                      setEditDurationInput(item.duration);
                      setEditLinkInput(item.meetingLink);
                    }}
                    variant="outline"
                    className="p-2 border-border text-primary hover:bg-primary/10 shrink-0 h-8.5"
                    title="Edit Class Details"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>

                  <Button
                    id={`btn-delete-class-${item.id}`}
                    onClick={() => deleteLiveClass(item.id)}
                    variant="outline"
                    className="p-2 border-border text-rose-500 hover:bg-rose-500/10 shrink-0 h-8.5"
                    title="Delete meeting log"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Live Class Attendance Analytics */}
                {isCompleted && (
                  <div className="mt-4 pt-4 border-t border-border/40 bg-muted/10 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      <BarChart2 className="w-4 h-4 text-primary animate-pulse" />
                      <span>Attendance Analytics</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="bg-muted/30 p-2 rounded-md border border-border/40">
                        <div className="text-[9px] font-bold text-muted-foreground uppercase">Total</div>
                        <div className="text-xs font-extrabold text-foreground">{item.studentCount || 84}</div>
                      </div>
                      <div className="bg-emerald-500/5 p-2 rounded-md border border-emerald-500/20">
                        <div className="text-[9px] font-bold text-emerald-500 uppercase">Present</div>
                        <div className="text-xs font-extrabold text-emerald-400">
                          {Math.round((item.studentCount || 84) * 0.7619)}
                        </div>
                      </div>
                      <div className="bg-rose-500/5 p-2 rounded-md border border-rose-500/20">
                        <div className="text-[9px] font-bold text-rose-500 uppercase">Absent</div>
                        <div className="text-xs font-extrabold text-rose-400">
                          {(item.studentCount || 84) - Math.round((item.studentCount || 84) * 0.7619)}
                        </div>
                      </div>
                      <div className="bg-primary/5 p-2 rounded-md border border-primary/20">
                        <div className="text-[9px] font-bold text-primary uppercase">Ratio</div>
                        <div className="text-xs font-extrabold text-primary">76.19%</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create live class scheduler dialog */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <Card className="max-w-md w-full border border-border bg-card shadow-2xl">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-xs font-extrabold uppercase text-muted-foreground">Schedule a Live Masterclass</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Class Title</Label>
                  <Input
                    type="text"
                    required
                    placeholder="E.g. Prompt Engineering sandbox"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    className="h-9 text-xs bg-muted/20"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">LMS Course Category</Label>
                  <select
                    value={courseInput}
                    onChange={(e) => setCourseInput(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-border bg-muted/20 text-xs font-semibold text-foreground focus:outline-hidden"
                  >
                    <option value="Foundations of Micro-Earning">Foundations of Micro-Earning</option>
                    <option value="Web3 & Token Rewards Ecosystem">Web3 & Token Rewards Ecosystem</option>
                    <option value="AI Automation & Workflow Mastery">AI Automation & Workflow Mastery</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Webinar Topic description</Label>
                  <Input
                    type="text"
                    required
                    placeholder="E.g. RLHF human feedback sweeps"
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    className="h-9 text-xs bg-muted/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Scheduled date</Label>
                    <Input
                      type="text"
                      required
                      placeholder="E.g. Today, June 25"
                      value={dateInput}
                      onChange={(e) => setDateInput(e.target.value)}
                      className="h-9 text-xs bg-muted/20 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Scheduled time</Label>
                    <Input
                      type="text"
                      required
                      placeholder="E.g. 05:00 PM"
                      value={timeInput}
                      onChange={(e) => setTimeInput(e.target.value)}
                      className="h-9 text-xs bg-muted/20 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Webinar Join Link</Label>
                  <Input
                    type="text"
                    required
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    className="h-9 text-xs bg-muted/20 font-mono"
                  />
                </div>

                {classSaving && (
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-md text-[10.5px] text-center font-medium">
                    Syncing scheduled meeting...
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    variant="outline"
                    className="text-xs font-semibold h-8.5 border-border"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={classSaving}
                    className="bg-primary text-xs font-bold px-5 h-8.5 text-primary-foreground"
                  >
                    Schedule Broadcast
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* End class upload recording link dialog */}
      {activeEndingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <Card className="max-w-md w-full border border-border bg-card shadow-2xl">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-xs font-extrabold uppercase text-muted-foreground">Complete Live Session & Link Recording</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleEndSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Archived recording URL</Label>
                  <Input
                    type="text"
                    required
                    placeholder="Enter recorded link address"
                    value={recordingLinkInput}
                    onChange={(e) => setRecordingLinkInput(e.target.value)}
                    className="h-9 text-xs bg-muted/20 font-mono"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    onClick={() => setActiveEndingId(null)}
                    variant="outline"
                    className="text-xs font-semibold h-8.5 border-border"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary text-xs font-bold px-5 h-8.5 text-primary-foreground"
                  >
                    End Meeting & Save Archive
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit live class scheduler dialog */}
      {editingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <Card className="max-w-md w-full border border-border bg-card shadow-2xl">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-xs font-extrabold uppercase text-muted-foreground">Edit Live Class Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Class Title</Label>
                  <Input
                    type="text"
                    required
                    placeholder="E.g. Prompt Engineering sandbox"
                    value={editTitleInput}
                    onChange={(e) => setEditTitleInput(e.target.value)}
                    className="h-9 text-xs bg-muted/20"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">LMS Course Category</Label>
                  <select
                    value={editCourseInput}
                    onChange={(e) => setEditCourseInput(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-border bg-muted/20 text-xs font-semibold text-foreground focus:outline-hidden"
                  >
                    <option value="Foundations of Micro-Earning">Foundations of Micro-Earning</option>
                    <option value="Web3 & Token Rewards Ecosystem">Web3 & Token Rewards Ecosystem</option>
                    <option value="AI Automation & Workflow Mastery">AI Automation & Workflow Mastery</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">Webinar Topic description</Label>
                  <Input
                    type="text"
                    required
                    placeholder="E.g. RLHF human feedback sweeps"
                    value={editTopicInput}
                    onChange={(e) => setEditTopicInput(e.target.value)}
                    className="h-9 text-xs bg-muted/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Scheduled date</Label>
                    <Input
                      type="text"
                      required
                      placeholder="E.g. Today, June 25"
                      value={editDateInput}
                      onChange={(e) => setEditDateInput(e.target.value)}
                      className="h-9 text-xs bg-muted/20 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Scheduled time</Label>
                    <Input
                      type="text"
                      required
                      placeholder="E.g. 05:00 PM"
                      value={editTimeInput}
                      onChange={(e) => setEditTimeInput(e.target.value)}
                      className="h-9 text-xs bg-muted/20 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Duration</Label>
                    <Input
                      type="text"
                      required
                      placeholder="E.g. 90 Mins"
                      value={editDurationInput}
                      onChange={(e) => setEditDurationInput(e.target.value)}
                      className="h-9 text-xs bg-muted/20 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Webinar Join Link</Label>
                    <Input
                      type="text"
                      required
                      value={editLinkInput}
                      onChange={(e) => setEditLinkInput(e.target.value)}
                      className="h-9 text-xs bg-muted/20 font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    onClick={() => setEditingClass(null)}
                    variant="outline"
                    className="text-xs font-semibold h-8.5 border-border"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary text-xs font-bold px-5 h-8.5 text-primary-foreground"
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );

  return (
    <div className="space-y-6">
      
      {/* Title bar greeting */}
      <div className="border-b border-border/40 pb-4">
        <h2 className="text-xl md:text-2xl font-black text-foreground uppercase tracking-tight flex items-center gap-2">
          <Video className="w-5 h-5 text-primary animate-pulse" />
          {userRole === 'instructor' ? 'Live Classes Manager' : 'LMS Live Classes'}
        </h2>
        <p className="text-xs text-muted-foreground font-sans mt-0.5">
          {userRole === 'instructor' 
            ? 'Broadcast live masterclasses to students, publish video archives, and track scheduled webinars.' 
            : 'Join scheduled Zoom webinar sessions or replay video archives.'}
        </p>
      </div>

      {userRole === 'instructor' ? renderInstructorView() : renderStudentView()}

    </div>
  );
}
