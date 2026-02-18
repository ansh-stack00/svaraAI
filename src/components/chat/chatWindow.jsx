'use client';

import { useState } from 'react';
import { Heart, MoreHorizontal } from 'lucide-react';
import clsx from 'clsx';
import { Bot } from 'lucide-react'
import { User } from 'lucide-react'


export function ChatWindow({ messages }) {
  const [likes, setLikes] = useState({});

  const toggleLike = (index) => {
    setLikes((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const getTimeString = () =>
    new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="flex flex-col flex-1 overflow-auto rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">

      {/* Header */}
      <div className="sticky top-0 z-10 px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm shadow-md">
            SvaraAI
          </div>
          <div>
            <p className="text-xs text-white font-medium">
              ● Online
            </p>
          </div>
        </div>

        <button className="p-2 hover:bg-slate-100 rounded-full transition">
          <MoreHorizontal size={18} className="text-slate-500" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1  px-6 py-6 space-y-6 bg-gradient-to-b from-white to-slate-50">

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-3xl shadow-inner">
              💬
            </div>
            <div>
              <p className="text-slate-700 font-semibold">
                Start a conversation
              </p>
              <p className="text-slate-400 text-sm mt-1">
                Your assistant is ready to help.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            const isLiked = likes[index];

            return (
              <div
                key={index}
                className={clsx(
                  'flex items-end gap-3 group animate-fadeIn',
                  isUser ? 'justify-end' : 'justify-start'
                )}
              >
               
                {!isUser && (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold shadow-md">
                    <Bot/>
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={clsx(
                    'relative max-w-[75%] px-4 py-3 rounded-xl text-lg leading-relaxed transition-all duration-200  shadow-lg text-white'
                  )}
                >
                  {msg.content}
                  <div
                    className={clsx(
                      'absolute -bottom-6 text-xs flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200',
                      isUser ? 'right-0' : 'left-0'
                    )}
                  >
                    <button
                      onClick={() => toggleLike(index)}
                      className={clsx(
                        'p-1 rounded-full transition',
                        isLiked
                          ? 'text-red-500 bg-red-50'
                          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                      )}
                    >
                      <Heart
                        size={14}
                        className={isLiked ? 'fill-current' : ''}
                      />
                    </button>

                    <span className="text-slate-400">
                      {getTimeString()}
                    </span>
                  </div>
                </div>

                {/* Optional User Avatar */}
                {isUser && (
                  <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold shadow-md">
                    <User/>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
