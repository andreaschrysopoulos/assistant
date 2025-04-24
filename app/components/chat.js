'use client'

import { useRef, useEffect, useState } from "react";

export default function Chat() {
  const textarea = useRef()
  const button = useRef()
  const contextWindowRef = useRef([])
  const scrollable = useRef()
  const [contextWindow, setContextWindow] = useState([])

  // Page load hook
  useEffect(() => {
    // Pull fresh data from DB
    pullChatFromDB();

    // Focus on the textbox when the user presses a key
    const focusOnTextarea = (event) => {
      const tag = document.activeElement.tagName.toLowerCase();
      if (tag !== 'input' && tag !== 'textarea') {
        textarea.current.focus();
      }
      textarea.current.focus()
    };
    window.addEventListener('keydown', focusOnTextarea);
    return () => {
      window.removeEventListener('keydown', focusOnTextarea);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pull fresh data from database
  async function pullChatFromDB() {
    const res = await fetch('/api/pullContextWindow')
    if (res.ok) {
      contextWindowRef.current = await res.json()
      syncChat();
    } else
      console.error('error pulling data from database')
  }

  // Debugging
  useEffect(() => {
    // Scroll to the bottom of the chat
    scrollable.current.scrollTop = scrollable.current.scrollHeight;
    console.log(contextWindow);
  }, [contextWindow])

  // Clear Chat
  async function clearChat() {

    // Send PATCH to backend and then the DB
    const res = await fetch('/api/clearContextWindow', {
      method: 'PATCH'
    })

    if (res.ok) {
      contextWindowRef.current = []
      syncChat();
      return { ok: true }
    }
    else
      return { ok: false }
  }

  // Weird solution to stale state
  function syncChat() {
    setContextWindow([...contextWindowRef.current]);
  }

  async function respond(event) {
    event.preventDefault();

    if (textarea.current.value.trim()) {
      // Disable send button, so nothing is sent while the assistant is responding
      button.current.disabled = true;

      // Update local chat with new user message
      contextWindowRef.current.push({ type: 'message', role: 'user', content: textarea.current.value })
      syncChat()

      // Clear the textbox
      textarea.current.value = ''

      // Send current context to backend for response
      let res = await fetch('/api/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contextWindowRef.current)
      })


      while (true) {

        res = await res.json();

        // ASSUMING! if last output element is message, the turn finished
        if (res.at(-1).type === 'message') {
          contextWindowRef.current.push(...res)
          syncChat()
          break
        }

        // If it's not a message, so *probably* a function_call_output, send context back for an answer
        else {
          contextWindowRef.current.push(...res)
          syncChat()

          res = await fetch('/api/respond', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contextWindowRef.current)
          })

        }
      }

      button.current.disabled = false;
    }
  }

  return (
    <div className="flex flex-col text-sm h-dvh">

      {/* Navigation Bar */}
      <div className="flex w-full items-center px-5 py-1.5 gap-5 justify-between">
        <button className="hover:bg-stone-200/60 dark:hover:bg-stone-800/70 active:bg-stone-200 dark:active:bg-stone-800 hover:cursor-pointer p-1.5 rounded-lg size-fit dark:text-stone-300" onClick={clearChat}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 4H7.2C6.0799 4 5.51984 4 5.09202 4.21799C4.71569 4.40974 4.40973 4.7157 4.21799 5.09202C4 5.51985 4 6.0799 4 7.2V16.8C4 17.9201 4 18.4802 4.21799 18.908C4.40973 19.2843 4.71569 19.5903 5.09202 19.782C5.51984 20 6.0799 20 7.2 20H16.8C17.9201 20 18.4802 20 18.908 19.782C19.2843 19.5903 19.5903 19.2843 19.782 18.908C20 18.4802 20 17.9201 20 16.8V12.5M15.5 5.5L18.3284 8.32843M10.7627 10.2373L17.411 3.58902C18.192 2.80797 19.4584 2.80797 20.2394 3.58902C21.0205 4.37007 21.0205 5.6364 20.2394 6.41745L13.3774 13.2794C12.6158 14.0411 12.235 14.4219 11.8012 14.7247C11.4162 14.9936 11.0009 15.2162 10.564 15.3882C10.0717 15.582 9.54378 15.6885 8.48793 15.9016L8 16L8.04745 15.6678C8.21536 14.4925 8.29932 13.9048 8.49029 13.3561C8.65975 12.8692 8.89125 12.4063 9.17906 11.9786C9.50341 11.4966 9.92319 11.0768 10.7627 10.2373Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="font-medium text-lg">Veronica v0.1</div>
      </div>

      {/* Messages */}
      <div ref={scrollable} className="w-full overflow-y-auto dark:scheme-dark h-full px-5">
        <div className="flex flex-col max-w-3xl mx-auto my-4">

          {contextWindow?.map((entry, index) => (
            // message
            entry.type === 'message'

              // role assistant
              ? (entry.role === 'assistant'
                ? <div key={index} className="pr-3 py-1.5 w-fit mb-4">{entry.content}</div>

                // role user
                : entry.role === 'user'
                  ? <div key={index} className="rounded-2xl px-3 py-1.5 self-end w-fit max-w-[70%] bg-stone-200/60 dark:bg-stone-800 mb-4">{entry.content}</div>
                  : null
              )

              // function call
              : entry.type === 'function_call'
                ? <div key={index} className="pr-3 py-1.5 w-fit opacity-50 italic">{'Memory updated'}</div>

                // other
                : null
          ))}
        </div>
      </div>

      {/* Send Message */}
      <div className="px-5 w-full">
        <form className="flex w-full pb-5 max-w-3xl mx-auto" action='javascript:void(0);'>

          {/* Textbox */}
          <input ref={textarea} className="border dark:border-stone-800 border-stone-300 rounded-l-lg w-full h-10 outline-none px-3" type="textarea" placeholder="Send message" />

          {/* Button */}
          <button ref={button} className="border-t border-r border-b rounded-r-lg dark:border-stone-800 border-stone-300 px-4 h-10 hover:dark:bg-stone-900 hover:bg-stone-200/70 active:bg-stone-200 dark:active:bg-stone-800 hover:cursor-pointer" onClick={respond}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">

              <g id="SVGRepo_bgCarrier" strokeWidth="0" />

              <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" />

              <g id="SVGRepo_iconCarrier"> <path d="M12 4L12 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /> <path d="M18 10L12.0625 4.0625V4.0625C12.028 4.02798 11.972 4.02798 11.9375 4.0625V4.0625L6 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /> </g>

            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}