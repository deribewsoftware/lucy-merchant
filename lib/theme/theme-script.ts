/** Inline before paint so `data-theme` matches localStorage (avoids flash). */
export const THEME_INIT_SCRIPT = `(function(){try{var k="lm-theme",s=localStorage.getItem(k),allowed=["business","corporate","light","night"],t=s&&allowed.indexOf(s)!==-1?s:"business";document.documentElement.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme","business");}})();`;
