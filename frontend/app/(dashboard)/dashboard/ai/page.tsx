'use client';

import { useState, useRef, useEffect } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import { Card, Button, Input, Select, Textarea, Badge, StatCard } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '@/lib/api';
import { timeAgo, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Send, Bot, Plus, Trash2, FileText, Mail, Briefcase, Zap, MessageSquare } from 'lucide-react';
import { useAuthStore } from '@/store/auth';

type Message = { role: 'user' | 'assistant'; content: string };

export default function AIPage() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<'chat' | 'generate'>('chat');
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genTab, setGenTab] = useState<'blog' | 'email' | 'proposal'>('blog');
  const [genForm, setGenForm] = useState<any>({});
  const [genResult, setGenResult] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations } = useQuery({
    queryKey: ['ai-conversations'],
    queryFn: () => aiApi.getConversations().then(r => r.data.data),
  });

  const { data: usageData } = useQuery({
    queryKey: ['ai-usage'],
    queryFn: () => aiApi.getUsage().then(r => r.data.data),
  });

  const { data: conversationData } = useQuery({
    queryKey: ['ai-conversation', activeConversation],
    queryFn: () => aiApi.getConversation(activeConversation!).then(r => r.data.data),
    enabled: !!activeConversation,
  });

  useEffect(() => {
    if (conversationData?.messages) setMessages(conversationData.messages);
  }, [conversationData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const newConversationMutation = useMutation({
    mutationFn: () => aiApi.createConversation({ title: 'New Chat' }),
    onSuccess: (data) => {
      const conv = data.data.data;
      setActiveConversation(conv.id);
      setMessages([]);
      qc.invalidateQueries({ queryKey: ['ai-conversations'] });
    },
  });

  const deleteConversationMutation = useMutation({
    mutationFn: (id: string) => aiApi.deleteConversation(id),
    onSuccess: () => {
      setActiveConversation(null);
      setMessages([]);
      qc.invalidateQueries({ queryKey: ['ai-conversations'] });
    },
  });

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(m => [...m, { role: 'user', content: userMsg }]);
    setGenerating(true);
    try {
      const { data } = await aiApi.chat({
        message: userMsg,
        conversation_id: activeConversation,
      });
      const result = data.data;
      if (!activeConversation && result.conversation_id) {
        setActiveConversation(result.conversation_id);
        qc.invalidateQueries({ queryKey: ['ai-conversations'] });
      }
      setMessages(m => [...m, { role: 'assistant', content: result.response || result.message }]);
    } catch (e: any) {
      toast.error(extractApiError(e));
      setMessages(m => m.slice(0, -1));
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGenResult('');
    try {
      let res;
      if (genTab === 'blog') res = await aiApi.generateBlog(genForm);
      else if (genTab === 'email') res = await aiApi.generateEmail(genForm);
      else res = await aiApi.generateProposal(genForm);
      const content = res.data.data?.content || res.data.data?.generated_content || JSON.stringify(res.data.data, null, 2);
      setGenResult(content);
      toast.success('Content generated!');
    } catch (e: any) {
      toast.error(extractApiError(e));
    } finally {
      setGenerating(false);
    }
  };

  const setG = (k: string, v: string) => setGenForm((f: any) => ({ ...f, [k]: v }));

  return (
    <DashboardLayout title="AI Assistant" breadcrumbs={[{ label: 'AI Assistant' }]}>
      <div className="space-y-6">
        {/* Usage stats */}
        {usageData && (
          <div className="grid grid-cols-3 gap-4">
            <StatCard title="Total Conversations" value={usageData.total_conversations || 0} icon={<MessageSquare className="w-5 h-5" />} color="blue" />
            <StatCard title="Messages This Month" value={usageData.messages_this_month || 0} icon={<Bot className="w-5 h-5" />} color="purple" />
            <StatCard title="Content Generated" value={usageData.content_generated || 0} icon={<Zap className="w-5 h-5" />} color="green" />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2">
          <button onClick={() => setTab('chat')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'chat' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
            <MessageSquare className="w-4 h-4 inline mr-2" />Chat
          </button>
          <button onClick={() => setTab('generate')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'generate' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
            <Zap className="w-4 h-4 inline mr-2" />Generate
          </button>
        </div>

        {tab === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" style={{ height: '65vh' }}>
            {/* Sidebar */}
            <div className="lg:col-span-1 flex flex-col">
              <Button className="mb-3" icon={<Plus className="w-4 h-4" />} onClick={() => newConversationMutation.mutate()} loading={newConversationMutation.isPending}>
                New Chat
              </Button>
              <div className="flex-1 overflow-y-auto space-y-1">
                {conversations?.map((c: any) => (
                  <div
                    key={c.id}
                    className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${activeConversation === c.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50 border border-transparent'}`}
                    onClick={() => setActiveConversation(c.id)}
                  >
                    <MessageSquare className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800 truncate">{c.title || 'Untitled'}</p>
                      <p className="text-xs text-slate-400">{timeAgo(c.updated_at)}</p>
                    </div>
                    <button
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-1"
                      onClick={e => { e.stopPropagation(); deleteConversationMutation.mutate(c.id); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {!conversations?.length && (
                  <p className="text-center text-slate-500 text-sm py-4">No conversations yet</p>
                )}
              </div>
            </div>

            {/* Chat Area */}
            <Card className="lg:col-span-3 flex flex-col !p-0 overflow-hidden" style={{ height: '65vh' }}>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {!messages.length && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4">
                      <Bot className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800">AI Assistant</h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-xs">Ask me anything about your projects, clients, or get help drafting content.</p>
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                      {['Summarize my open tickets', 'Draft a follow-up email', 'List overdue projects'].map(s => (
                        <button key={s} onClick={() => { setInput(s); }} className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full text-slate-600 transition-colors">{s}</button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gradient-to-br from-purple-500 to-indigo-600'}`}>
                      {msg.role === 'user' ? (
                        <span className="text-white text-xs font-bold">{user?.display_name?.[0]}</span>
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-slate-100 text-slate-800 rounded-tl-sm'}`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {generating && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-slate-200 p-4">
                <div className="flex gap-2">
                  <input
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type a message…"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                    disabled={generating}
                  />
                  <Button onClick={sendMessage} loading={generating} disabled={!input.trim()} icon={<Send className="w-4 h-4" />}>
                    Send
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {tab === 'generate' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Generator Form */}
            <Card>
              <div className="flex gap-2 mb-6">
                {[
                  { id: 'blog', label: 'Blog Post', icon: FileText },
                  { id: 'email', label: 'Email', icon: Mail },
                  { id: 'proposal', label: 'Proposal', icon: Briefcase },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => { setGenTab(id as any); setGenForm({}); setGenResult(''); }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${genTab === id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>

              {genTab === 'blog' && (
                <div className="space-y-4">
                  <Input label="Topic *" value={genForm.topic || ''} onChange={e => setG('topic', e.target.value)} placeholder="e.g. Benefits of cloud migration" />
                  <Input label="Target Audience" value={genForm.target_audience || ''} onChange={e => setG('target_audience', e.target.value)} placeholder="e.g. CTOs and IT managers" />
                  <Select label="Tone" options={[{ value: 'professional', label: 'Professional' }, { value: 'casual', label: 'Casual' }, { value: 'educational', label: 'Educational' }]} value={genForm.tone || 'professional'} onChange={e => setG('tone', e.target.value)} />
                  <Input label="Keywords (comma-separated)" value={genForm.keywords || ''} onChange={e => setG('keywords', e.target.value)} />
                </div>
              )}

              {genTab === 'email' && (
                <div className="space-y-4">
                  <Input label="Purpose *" value={genForm.purpose || ''} onChange={e => setG('purpose', e.target.value)} placeholder="e.g. Follow-up after demo call" />
                  <Input label="Recipient Name" value={genForm.recipient_name || ''} onChange={e => setG('recipient_name', e.target.value)} />
                  <Input label="Company" value={genForm.company || ''} onChange={e => setG('company', e.target.value)} />
                  <Select label="Tone" options={[{ value: 'professional', label: 'Professional' }, { value: 'friendly', label: 'Friendly' }, { value: 'formal', label: 'Formal' }]} value={genForm.tone || 'professional'} onChange={e => setG('tone', e.target.value)} />
                  <Textarea label="Key Points" value={genForm.key_points || ''} onChange={e => setG('key_points', e.target.value)} rows={3} placeholder="Key details to include…" />
                </div>
              )}

              {genTab === 'proposal' && (
                <div className="space-y-4">
                  <Input label="Client Name *" value={genForm.client_name || ''} onChange={e => setG('client_name', e.target.value)} />
                  <Input label="Project Type" value={genForm.project_type || ''} onChange={e => setG('project_type', e.target.value)} placeholder="e.g. Web Application Development" />
                  <Textarea label="Requirements" value={genForm.requirements || ''} onChange={e => setG('requirements', e.target.value)} rows={3} />
                  <Input label="Budget Range" value={genForm.budget_range || ''} onChange={e => setG('budget_range', e.target.value)} placeholder="e.g. $50,000 – $80,000" />
                  <Input label="Timeline" value={genForm.timeline || ''} onChange={e => setG('timeline', e.target.value)} placeholder="e.g. 4 months" />
                </div>
              )}

              <Button className="w-full mt-6" loading={generating} onClick={handleGenerate} icon={<Zap className="w-4 h-4" />}>
                Generate with AI
              </Button>
            </Card>

            {/* Result */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">Generated Content</h3>
                {genResult && (
                  <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(genResult); toast.success('Copied!'); }}>
                    Copy
                  </Button>
                )}
              </div>
              {genResult ? (
                <div className="bg-slate-50 rounded-xl p-4 max-h-[500px] overflow-y-auto">
                  <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">{genResult}</pre>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Zap className="w-12 h-12 text-slate-200 mb-3" />
                  <p className="text-slate-500 text-sm">Fill in the form and click Generate</p>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
