import { useEffect, useRef, useState, useCallback } from "react";

export interface IframeError {
  type: "runtime" | "console" | "unhandled";
  message: string;
  timestamp: number;
}

const MAX_ERRORS = 20;

/**
 * Listens for error messages posted from the preview iframe.
 * The iframe must have the error-catching script injected (see injectErrorCatcher).
 */
export function useIframeErrors() {
  const [errors, setErrors] = useState<IframeError[]>([]);
  const errorsRef = useRef<IframeError[]>([]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      // Only accept messages from same origin or srcdoc iframes (origin "null")
      if (event.origin !== window.location.origin && event.origin !== "null") return;
      if (event.data?.source !== "helphand-preview") return;

      const err: IframeError = {
        type: event.data.type ?? "runtime",
        message: event.data.message ?? "Unknown error",
        timestamp: Date.now(),
      };

      // Deduplicate: skip if same message in last 5 seconds
      const recent = errorsRef.current.filter(
        (e) => e.message === err.message && Date.now() - e.timestamp < 5000
      );
      if (recent.length > 0) return;

      errorsRef.current = [...errorsRef.current.slice(-(MAX_ERRORS - 1)), err];
      setErrors([...errorsRef.current]);
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const clearErrors = useCallback(() => {
    errorsRef.current = [];
    setErrors([]);
  }, []);

  return { errors, clearErrors };
}

/**
 * Wraps srcDoc HTML with an error-catching script that posts errors to the parent.
 * Uses a split trick to avoid the browser interpreting </script> inside the string.
 */
export function injectErrorCatcher(html: string): string {
  // Build the script as an array to avoid </script> appearing literally
  // which would break the HTML parser
  const script = [
    "<script>",
    "(function(){",
    // postMessage helper
    "var p=function(t,m){try{parent.postMessage({source:'helphand-preview',type:t,message:String(m).slice(0,500)},'*')}catch(e){}};",
    // Catch runtime errors
    "window.onerror=function(m,s,l){p('runtime',m+(l?' (line '+l+')':''))};",
    // Catch unhandled promise rejections
    "window.addEventListener('unhandledrejection',function(e){p('unhandled',e.reason?String(e.reason):'Unhandled promise rejection')});",
    // Intercept console.error
    "var oe=console.error;console.error=function(){var a=[].slice.call(arguments);p('console',a.map(function(x){return typeof x==='object'?JSON.stringify(x):String(x)}).join(' '));oe.apply(console,arguments)};",
    // PROACTIVE SCAN: check for issues on page load before user interacts
    "document.addEventListener('DOMContentLoaded',function(){",
    // 1. Check all inline event handlers for undefined functions
    "var evts=['onclick','onchange','onsubmit','onmouseover','onkeydown','onkeyup','oninput','onfocus','onblur'];",
    "evts.forEach(function(ev){",
    "var els=document.querySelectorAll('['+ev+']');",
    "els.forEach(function(el){",
    "var code=el.getAttribute(ev);",
    "if(!code)return;",
    "var fns=code.match(/([a-zA-Z_$][a-zA-Z0-9_$]*)\\s*\\(/g);",
    "if(!fns)return;",
    "fns.forEach(function(fn){",
    "var name=fn.replace(/\\s*\\($/,'');",
    "if(['alert','confirm','prompt','console','parseInt','parseFloat','setTimeout','setInterval','clearTimeout','clearInterval','Math','Date','JSON','encodeURI','decodeURI','encodeURIComponent','decodeURIComponent','isNaN','isFinite','Number','String','Boolean','Array','Object','this','event','document','window','navigator','history','location','fetch','XMLHttpRequest'].indexOf(name)!==-1)return;",
    "try{if(typeof eval(name)!=='function'){p('runtime','Function \"'+name+'()\" is used in '+ev+' but is not defined — will crash when triggered')}}catch(e){p('runtime','Function \"'+name+'()\" is used in '+ev+' but is not defined — will crash when triggered')}",
    "});",
    "});",
    "});",
    // 2. Check for addEventListener calls referencing undefined functions
    // (handled by runtime onerror)
    // 3. Check for empty/broken body
    "var body=document.body;",
    "if(body&&body.innerHTML.trim().length===0){p('runtime','Page body is empty — nothing is rendered')}",
    // 4. Check for broken images
    "var imgs=document.querySelectorAll('img');",
    "imgs.forEach(function(img){img.addEventListener('error',function(){p('runtime','Image failed to load: '+(img.src||img.getAttribute('src')||'unknown'))})});",
    // 5. Check for broken links in stylesheets
    "var links=document.querySelectorAll('link[rel=stylesheet]');",
    "links.forEach(function(link){",
    "if(link.href&&!link.sheet){p('runtime','Stylesheet failed to load: '+link.href)}",
    "});",
    "});",
    "})();",
    "<\\/script>",
  ].join("");

  // Fix the escaped closing tag
  const scriptTag = script.replace("<\\/script>", "</script>");

  try {
    if (html.includes("<head>")) {
      return html.replace("<head>", "<head>" + scriptTag);
    }
    if (html.includes("<HEAD>")) {
      return html.replace("<HEAD>", "<HEAD>" + scriptTag);
    }
    if (html.includes("<html>") || html.includes("<HTML>")) {
      return html.replace(/<html>/i, "$&<head>" + scriptTag + "</head>");
    }
    // Prepend for bare HTML
    return scriptTag + html;
  } catch {
    // If injection fails for any reason, return original code
    return html;
  }
}
