'use client';

import { useState, useRef, useEffect } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import { Card, Button, Input, Select, Textarea, Badge, StatCard, ConfirmDialog } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '@/lib/api';
import { timeAgo, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Send, Bot, Plus, Trash2, FileText, Mail, Briefcase,
  Zap, MessageSquare, Copy, Check, Sparkles, RefreshCw
} from 'lucide-react';
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
  const [conversationToDelete, setConversationToDelete] = useState<any>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Generator State
  const [genTab, setGenTab] = useState<'blog' | 'email' | 'proposal'>('blog');
  const [genForm, setGenForm] = useState<any>({});
  const [genResult, setGenResult] = useState('');
  const [copiedGen, setCopiedGen] = useState(false);

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
    if (conversationData?.messages) {
      setMessages(conversationData.messages);
    }
  }, [conversationData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, generating]);

  const newConversationMutation = useMutation({
    mutationFn: () => aiApi.createConversation({ title: 'New Conversation' }),
    onSuccess: (data) => {
      const conv = data.data.data;
      setActiveConversation(conv.id);
      setMessages([]);
      qc.invalidateQueries({ queryKey: ['ai-conversations'] });
      toast.success('Started new conversation');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deleteConversationMutation = useMutation({
    mutationFn: (id: string) => aiApi.deleteConversation(id),
    onSuccess: () => {
      if (conversationToDelete && activeConversation === conversationToDelete.id) {
        setActiveConversation(null);
        setMessages([]);
      }
      setConversationToDelete(null);
      qc.invalidateQueries({ queryKey: ['ai-conversations'] });
      toast.success('Conversation deleted');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const sendMessage = async () => {
    if (!input.trim() || generating) return;
    const userMsg = input.trim();
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
      qc.invalidateQueries({ queryKey: ['ai-usage'] });
    } catch (e: any) {
      toast.error(extractApiError(e));
      setMessages(m => m.slice(0, -1));
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerate = async () => {
    // Validation
    if (genTab === 'blog' && !genForm.topic?.trim()) {
      toast.error('Please enter a topic for the blog post');
      return;
    }
    if (genTab === 'email' && !genForm.purpose?.trim()) {
      toast.error('Please enter the purpose of the email');
      return;
    }
    if (genTab === 'proposal' && !genForm.client_name?.trim()) {
      toast.error('Please enter the client name for the proposal');
      return;
    }

    setGenerating(true);
    setGenResult('');
    try {
      let res;
      if (genTab === 'blog') res = await aiApi.generateBlog(genForm);
      else if (genTab === 'email') res = await aiApi.generateEmail(genForm);
      else res = await aiApi.generateProposal(genForm);

      const content = res.data.data?.content || res.data.data?.generated_content || (typeof res.data.data === 'string' ? res.data.data : JSON.stringify(res.data.data, null, 2));
      setGenResult(content);
      qc.invalidateQueries({ queryKey: ['ai-usage'] });
      toast.success('Content generated successfully!');
    } catch (e: any) {
      toast.error(extractApiError(e));
    } finally {
      setGenerating(false);
    }
  };

  const copyMessage = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyGenResult = () => {
    if (!genResult) return;
    navigator.clipboard.writeText(genResult);
    setCopiedGen(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedGen(false), 2000);
  };

  const setG = (k: string, v: string) => setGenForm((f: any) => ({ ...f, [k]: v }));

  return (
    <DashboardLayout title="AI Assistant" breadcrumbs={[{ label: 'AI Assistant' }]}>
      <div className="space-y-6">
        {/* Usage Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total Conversations"
            value={usageData?.total_conversations || conversations?.length || 0}
            icon={<MessageSquare className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            title="Messages This Month"
            value={usageData?.messages_this_month || 0}
            icon={<Bot className="w-5 h-5" />}
            color="purple"
          />
          <StatCard
            title="Content Generated"
            value={usageData?.content_generated || 0}
            icon={<Zap className="w-5 h-5" />}
            color="green"
          />
        </div>

        {/* Primary View Switcher Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            onClick={() => setTab('chat')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === 'chat'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            AI Chat Assistant
          </button>
          <button
            type="button"
            onClick={() => setTab('generate')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === 'generate'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Content Generator
          </button>
        </div>

        {/* TAB 1: AI Chat Assistant */}
        {tab === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[580px] h-[calc(100vh-17rem)]">
            {/* Conversations History Sidebar */}
            <div className="lg:col-span-1 flex flex-col bg-white rounded-xl border border-slate-200 p-3 h-full overflow-hidden">
              <Button
                className="w-full mb-3 shadow-xs"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => newConversationMutation.mutate()}
                loading={newConversationMutation.isPending}
              >
                New Conversation
              </Button>

              <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                {conversations?.map((c: any) => (
                  <div
                    key={c.id}
                    className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all ${
                      activeConversation === c.id
                        ? 'bg-blue-50 border border-blue-200 text-blue-900 font-medium'
                        : 'hover:bg-slate-50 border border-transparent text-slate-700'
                    }`}
                    onClick={() => setActiveConversation(c.id)}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <MessageSquare className={`w-4 h-4 flex-shrink-0 ${activeConversation === c.id ? 'text-blue-600' : 'text-slate-400'}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs truncate font-medium">{c.title || 'Conversation'}</p>
                        <p className="text-[10px] text-slate-400">{timeAgo(c.updated_at || c.created_at)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-1 rounded transition-opacity"
                      title="Delete conversation"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConversationToDelete(c);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {!conversations?.length && (
                  <div className="text-center py-10 px-2 text-slate-400 text-xs">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p>No past conversations</p>
                    <p className="mt-1">Click "New Conversation" to start chatting</p>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Messages Panel */}
            <Card className="lg:col-span-3 flex flex-col !p-0 overflow-hidden h-full border border-slate-200">
              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/40">
                {!messages.length && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center mb-4 shadow-md shadow-blue-500/20">
                      <Bot className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Antigravity AI Assistant</h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-md">
                      Ask questions about client accounts, project milestones, system audits, or request drafts for emails and proposals.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-lg">
                      {[
                        'Summarize open support tickets',
                        'Draft an introduction email for a new enterprise lead',
                        'What services have the highest revenue this quarter?',
                      ].map((promptText) => (
                        <button
                          key={promptText}
                          type="button"
                          onClick={() => setInput(promptText)}
                          className="text-xs bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 px-3 py-1.5 rounded-full text-slate-600 transition-colors shadow-2xs text-left"
                        >
                          "{promptText}"
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-xs ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white text-xs font-bold'
                          : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white'
                      }`}
                    >
                      {msg.role === 'user' ? (user?.display_name?.[0] || 'U') : <Bot className="w-4 h-4" />}
                    </div>

                    <div className={`group relative max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-2xs ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-xs'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                    }`}>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                      {/* Copy Message Action for Assistant */}
                      {msg.role === 'assistant' && (
                        <button
                          type="button"
                          onClick={() => copyMessage(msg.content, i)}
                          className="absolute -bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 rounded-md p-1 text-slate-400 hover:text-blue-600 shadow-xs flex items-center gap-1 text-[10px]"
                          title="Copy response"
                        >
                          {copiedIndex === i ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {generating && (
                  <div className="flex gap-3 items-center">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-xs">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs px-4 py-3 shadow-2xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        <span className="text-xs text-slate-400 ml-2 font-medium">Generating response...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="border-t border-slate-200 p-3 sm:p-4 bg-white">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    placeholder="Type your message or prompt here..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    disabled={generating}
                  />
                  <Button
                    type="submit"
                    loading={generating}
                    disabled={!input.trim()}
                    icon={<Send className="w-4 h-4" />}
                  >
                    Send
                  </Button>
                </form>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 2: Content Generator */}
        {tab === 'generate' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Generator Form */}
            <Card>
              <div className="flex gap-2 mb-6 border-b border-slate-100 pb-3">
                {[
                  { id: 'blog', label: 'Blog Article', icon: FileText },
                  { id: 'email', label: 'Marketing Email', icon: Mail },
                  { id: 'proposal', label: 'Client Proposal', icon: Briefcase },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setGenTab(id as any);
                      setGenForm({});
                      setGenResult('');
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      genTab === id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              {genTab === 'blog' && (
                <div className="space-y-4">
                  <Input
                    label="Topic / Title *"
                    value={genForm.topic || ''}
                    onChange={e => setG('topic', e.target.value)}
                    placeholder="e.g. 5 Cloud Cost Optimization Strategies for 2026"
                    required
                  />
                  <Input
                    label="Target Audience"
                    value={genForm.target_audience || ''}
                    onChange={e => setG('target_audience', e.target.value)}
                    placeholder="e.g. CTOs, Engineering Directors, DevOps Leads"
                  />
                  <Select
                    label="Tone"
                    options={[
                      { value: 'professional', label: 'Professional & Authoritative' },
                      { value: 'casual', label: 'Casual & Conversational' },
                      { value: 'educational', label: 'Educational & Technical' },
                    ]}
                    value={genForm.tone || 'professional'}
                    onChange={e => setG('tone', e.target.value)}
                  />
                  <Input
                    label="Keywords (comma-separated)"
                    value={genForm.keywords || ''}
                    onChange={e => setG('keywords', e.target.value)}
                    placeholder="e.g. AWS, Kubernetes, Cloud Governance, FinOps"
                  />
                </div>
              )}

              {genTab === 'email' && (
                <div className="space-y-4">
                  <Input
                    label="Email Purpose *"
                    value={genForm.purpose || ''}
                    onChange={e => setG('purpose', e.target.value)}
                    placeholder="e.g. Post-demo follow up with security enterprise client"
                    required
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Recipient Name"
                      value={genForm.recipient_name || ''}
                      onChange={e => setG('recipient_name', e.target.value)}
                      placeholder="e.g. Sarah Connor"
                    />
                    <Input
                      label="Company Name"
                      value={genForm.company || ''}
                      onChange={e => setG('company', e.target.value)}
                      placeholder="e.g. Cyberdyne Systems"
                    />
                  </div>
                  <Select
                    label="Tone"
                    options={[
                      { value: 'professional', label: 'Professional & Polite' },
                      { value: 'friendly', label: 'Warm & Friendly' },
                      { value: 'formal', label: 'Executive Formal' },
                    ]}
                    value={genForm.tone || 'professional'}
                    onChange={e => setG('tone', e.target.value)}
                  />
                  <Textarea
                    label="Key Points / Next Steps"
                    value={genForm.key_points || ''}
                    onChange={e => setG('key_points', e.target.value)}
                    rows={3}
                    placeholder="Highlight 99.99% uptime, SOC2 compliance, scheduling 30-min architecture review"
                  />
                </div>
              )}

              {genTab === 'proposal' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Client Name *"
                      value={genForm.client_name || ''}
                      onChange={e => setG('client_name', e.target.value)}
                      placeholder="e.g. Acme Corporation"
                      required
                    />
                    <Input
                      label="Project Type"
                      value={genForm.project_type || ''}
                      onChange={e => setG('project_type', e.target.value)}
                      placeholder="e.g. Enterprise Web Portal Modernization"
                    />
                  </div>
                  <Textarea
                    label="Core Requirements & Deliverables"
                    value={genForm.requirements || ''}
                    onChange={e => setG('requirements', e.target.value)}
                    rows={3}
                    placeholder="Next.js frontend, microservices backend, SSO authentication, multi-region database"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Budget Range"
                      value={genForm.budget_range || ''}
                      onChange={e => setG('budget_range', e.target.value)}
                      placeholder="e.g. $45,000 – $65,000 USD"
                    />
                    <Input
                      label="Timeline"
                      value={genForm.timeline || ''}
                      onChange={e => setG('timeline', e.target.value)}
                      placeholder="e.g. 12 weeks across 3 milestones"
                    />
                  </div>
                </div>
              )}

              <Button
                className="w-full mt-6 shadow-xs"
                loading={generating}
                onClick={handleGenerate}
                icon={<Sparkles className="w-4 h-4" />}
              >
                Generate Draft with AI
              </Button>
            </Card>

            {/* Generated Content Output Card */}
            <Card className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-semibold text-slate-800">Generated Output</h3>
                  <p className="text-xs text-slate-400">Review, copy, or refine the AI draft</p>
                </div>
                {genResult && (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={copiedGen ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    onClick={copyGenResult}
                  >
                    {copiedGen ? 'Copied' : 'Copy Text'}
                  </Button>
                )}
              </div>

              {genResult ? (
                <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 overflow-y-auto max-h-[500px]">
                  <pre className="text-xs sm:text-sm text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
                    {genResult}
                  </pre>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                    <Zap className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">No output generated yet</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Configure your parameters on the left and click "Generate Draft" to produce content.
                  </p>
                </div>
              )}

              {genResult && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Characters: {genResult.length}</span>
                  <span>Words: {genResult.split(/\s+/).filter(Boolean).length}</span>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* Delete Conversation Confirm Dialog */}
      <ConfirmDialog
        open={!!conversationToDelete}
        onClose={() => setConversationToDelete(null)}
        onConfirm={() => conversationToDelete && deleteConversationMutation.mutate(conversationToDelete.id)}
        title="Delete AI Conversation"
        description={`Are you sure you want to delete "${conversationToDelete?.title || 'this conversation'}"? All chat history within this thread will be permanently removed.`}
        confirmText="Delete Conversation"
        variant="danger"
        loading={deleteConversationMutation.isPending}
      />
    </DashboardLayout>
  );
}