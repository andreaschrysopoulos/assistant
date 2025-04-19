'use client'

import OpenAI from "openai";
import { useRef } from "react";

export default function Chat({ client }) {

  const textarea = useRef()
  const button = useRef()

  async function respond(event) {
    event.preventDefault();

    if (textarea.current.value) {

      const message = textarea.current.value;
      textarea.current.value = '';
      button.current.disabled = true;

      // Send to OpenAI:
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: [{ role: 'user', content: message }] })
      });
      const { reply } = await res.json();

      console.log(reply)
      button.current.disabled = false;


    } else
      return


  }

  return (
    <>
      <div className="h-full">
        <div className="flex max-w-5xl mx-auto h-dvh items-end">


          <form className="flex w-full pb-4" action='javascript:void(0);'>
            <input ref={textarea} className="border border-stone-800 rounded-l-lg w-full h-10 outline-none px-3" type="textarea" />
            <button ref={button} className="border-t border-r border-b rounded-r-lg border-stone-800 px-4 h-10 hover:dark:bg-stone-900 hover:cursor-pointer" onClick={respond}>Send</button>
          </form>


        </div>
      </div>
    </>
  )
}