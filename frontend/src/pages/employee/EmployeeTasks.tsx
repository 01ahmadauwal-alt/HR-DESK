import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, MessageSquare, Users, ChevronDown, ChevronUp } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import api from '../../api/client';
import type { Task, Employee } from '../../types';
import { formatDate, formatDateTime } from '../../utils/formatters';

function TaskCard({ task }: { task: Task }) {
  const qc = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');

  const complete = useMutation({
    mutationFn: () => api.post(`/employee/tasks/${task._id}/complete`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-tasks'] }),
  });

  const addComment = useMutation({
    mutationFn: (text: string) => api.post(`/employee/tasks/${task._id}/comments`, { text }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-tasks'] }); setComment(''); },
  });

  const respondCollab = useMutation({
    mutationFn: (action: string) => api.put(`/employee/tasks/${task._id}/collaborate`, { action }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-tasks'] }),
  });

  const myCollab = task.collaborators.find(c => (c.employeeId as Employee)?._id);
  const isDone = task.status === 'done' || task.status === 'cancelled';

  return (
    <div className="card overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-semibold text-slate-800">{task.title}</h4>
              <Badge status={task.priority} />
              <Badge status={task.status} />
            </div>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
              <span>Due {formatDate(task.dueDate)}</span>
              <span>{task.comments.length} comment{task.comments.length !== 1 ? 's' : ''}</span>
              {task.isOpenForCollaboration && (
                <span className="text-primary font-medium">Open for collaboration</span>
              )}
            </div>
          </div>
          {!isDone && (
            <button
              onClick={() => complete.mutate()}
              disabled={complete.isPending}
              className="btn-secondary px-3 py-1.5 text-xs flex-shrink-0"
            >
              <CheckCircle size={13} className="text-success" />
              Mark Done
            </button>
          )}
        </div>

        {myCollab?.status === 'pending' && (
          <div className="mt-3 flex items-center gap-2 p-3 bg-primary-50 rounded-lg">
            <span className="text-xs text-primary font-medium flex-1">You've been invited to collaborate on this task</span>
            <button onClick={() => respondCollab.mutate('accepted')} className="btn-primary px-3 py-1 text-xs">Accept</button>
            <button onClick={() => respondCollab.mutate('declined')} className="btn-secondary px-3 py-1 text-xs">Decline</button>
          </div>
        )}
      </div>

      {/* Comments */}
      <div className="border-t border-slate-100">
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 px-4 py-2 text-xs text-slate-500 hover:bg-slate-50 w-full transition-colors"
        >
          <MessageSquare size={13} />
          Comments ({task.comments.length})
          {showComments ? <ChevronUp size={12} className="ml-auto" /> : <ChevronDown size={12} className="ml-auto" />}
        </button>

        {showComments && (
          <div className="px-4 pb-4 space-y-3">
            {task.comments.map(c => (
              <div key={c._id} className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-200 flex-shrink-0 mt-0.5" />
                <div className="flex-1 bg-slate-50 rounded-lg px-3 py-2">
                  <p className="text-xs text-slate-700">{c.text}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(c.createdAt)}</p>
                </div>
              </div>
            ))}
            <div className="flex gap-2 mt-2">
              <input
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="input text-xs py-1.5"
                onKeyDown={e => e.key === 'Enter' && comment.trim() && addComment.mutate(comment)}
              />
              <button
                onClick={() => comment.trim() && addComment.mutate(comment)}
                disabled={addComment.isPending || !comment.trim()}
                className="btn-primary px-3 py-1.5 text-xs"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EmployeeTasks() {
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['my-tasks'],
    queryFn: () => api.get('/employee/tasks').then(r => r.data),
  });

  const active = tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled');
  const completed = tasks.filter(t => t.status === 'done');

  return (
    <DashboardLayout title="My Tasks">
      <div className="space-y-6">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            <div className="space-y-3">
              <h3 className="section-title">Active ({active.length})</h3>
              {active.length === 0 ? (
                <div className="card"><EmptyState title="No active tasks" description="You're all caught up!" /></div>
              ) : (
                active.map(t => <TaskCard key={t._id} task={t} />)
              )}
            </div>
            {completed.length > 0 && (
              <div className="space-y-3">
                <h3 className="section-title text-slate-400">Completed ({completed.length})</h3>
                {completed.slice(0, 5).map(t => <TaskCard key={t._id} task={t} />)}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
