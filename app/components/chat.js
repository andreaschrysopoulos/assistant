'use client'

import { useRef, useEffect, useState } from "react";

export default function Chat() {
  const textarea = useRef()
  const button = useRef()

  const [chatName, setChatName] = useState()
  const [chatId, setChatId] = useState()
  const [context, setContext] = useState([])

  async function fetchHistory() {
    const res = await fetch('/api/getChat');
    if (res.ok) {
      const data = await res.json();
      setChatName(data.chat_name);
      setChatId(data.id);
      setContext(data.context);
      return data.context;
    }
  }

  useEffect(() => {
    fetchHistory();
  }, []);


  useEffect(() => {
    console.log(`Chat ID: ${chatId}`)
    console.log(`Chat Name: "${chatName}"`)
    console.log("Chat Messages: ", context)
  }, [chatId, chatName, context]);

  async function clearChat() {

    const res = await fetch('/api/clearChat', {
      method: 'PATCH'
    })
    console.log(res);
    if (res.ok) {
      fetchHistory();
    }

  }

  async function respond(event) {
    event.preventDefault();

    if (textarea.current.value.trim()) {

      const message = textarea.current.value;
      textarea.current.value = '';
      button.current.disabled = true;

      let tempContext = [...context, { type: 'message', role: 'user', content: message }]

      setContext(tempContext)


      // Talk to backend:
      let res = await fetch('/api/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tempContext)
      })

      let reply;

      while (true) {
        reply = await res.json();
        // Intercept to check for a funtion call
        if (reply.output[0]?.type === 'message') {
          fetchHistory();
          break;
        }
        else if (reply.output[0]?.type === 'function_call') {
          tempContext = await fetchHistory()
          res = await fetch('/api/respond', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tempContext)
          })
        }
      }

      button.current.disabled = false;


    } else
      return
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
      <div className="w-full overflow-y-auto dark:scheme-dark h-full px-5">
        <div className="flex flex-col max-w-3xl mx-auto my-4">
          {context.map((entry, index) => (
            entry.type === 'message' ? (
              entry.role === 'assistant' ?
                // Assistant Message
                <div key={index} className="pr-3 py-1.5 w-fit mb-4">{entry.content}</div>
                :
                // User Message
                <div key={index} className="rounded-2xl px-3 py-1.5 self-end w-fit max-w-[70%] bg-stone-200/60 dark:bg-stone-800 mb-4">{entry.content}</div>)
              : entry.type === 'function_call' ?
                // Function Call
                <div key={index} className="pr-3 py-1.5 w-fit opacity-50 italic">{`Function call: ${entry.name}`}</div>
                : null
          ))
          }
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