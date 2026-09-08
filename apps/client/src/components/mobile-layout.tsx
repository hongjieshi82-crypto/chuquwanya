export function MobileLayoutStyles() {
  return <style>{`
.mobile-bottom-nav{display:none}
@media(max-width:760px){
html,body,#root{background:#090b09;overscroll-behavior-y:none}
body{--mobile-bottom:calc(70px + env(safe-area-inset-bottom,0px))}
.mobile-bottom-nav{position:fixed;z-index:120;bottom:0;left:0;right:0;display:grid;grid-template-columns:repeat(4,1fr);height:var(--mobile-bottom);padding:5px 12px calc(5px + env(safe-area-inset-bottom,0px));border-top:1px solid #ffffff14;background:rgba(12,16,13,.96);backdrop-filter:blur(20px)}
.mobile-bottom-nav a{border:0;background:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:48px;color:#929c91;text-decoration:none;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.mobile-nav-icon-wrap{display:grid;place-items:center;width:48px;height:32px;border-radius:12px;transition:background .18s,color .18s}
.mobile-nav-label{font-size:10px;font-weight:650;line-height:14px;letter-spacing:.06em}
.mobile-bottom-nav [aria-current=page]{color:#c9ff62}.mobile-bottom-nav [aria-current=page] .mobile-nav-icon-wrap{background:rgba(201,255,98,.1)}.mobile-bottom-nav [aria-current=page] .mobile-nav-label{font-weight:800}
.mobile-bottom-nav a:focus-visible{outline:2px solid #c9ff62;outline-offset:-2px;border-radius:14px}
.mobile-nav-dot{width:4px;height:4px;border-radius:50%;background:transparent}.mobile-bottom-nav [aria-current] .mobile-nav-dot{background:#c9ff62}
.pc-experience-shell{background:#090b09!important;padding-bottom:var(--mobile-bottom)}
.pc-experience-shell:has(.mobile-home-frame){padding-bottom:0}
.pc-experience-shell-header{height:68px!important;min-height:68px!important;padding:0 20px!important;flex-wrap:nowrap!important;gap:12px!important}
.pc-experience-shell-brand{font-size:17px!important;gap:8px!important;min-width:0!important}.pc-experience-shell-brand img{width:34px!important;height:34px!important}
.pc-experience-shell-header .pc-top-nav-menu,.pc-experience-shell-header .pc-top-nav-mobile-trigger{display:none!important}
.pc-experience-shell-header .pc-top-nav-actions{display:flex!important}.pc-top-nav-user-label,.pc-top-nav-user-chevron{display:none!important}
.pc-experience-shell-cta.ant-btn{width:104px;min-width:104px;height:42px;font-size:13px;padding:0 10px}
.mobile-home-frame{height:calc(100dvh - var(--mobile-bottom))!important}
.pc-box-page,.pc-trips-page,.pc-destinations-page{padding:24px 20px 32px!important;min-height:calc(100dvh - 138px)!important}
/* Keep controls outside the snapping list, with one bounded scroll viewport. */
.pc-experience-shell:has(.pc-trips-page){position:fixed;inset:0 0 var(--mobile-bottom);height:auto;min-height:0!important;padding-bottom:0;display:flex;flex-direction:column;overflow:hidden}
.pc-experience-shell:has(.pc-trips-page)>.pc-experience-shell-header{flex:none}
.pc-experience-shell-content:has(.pc-trips-page){flex:1;min-height:0!important;overflow:hidden}
.pc-trips-page{height:100%;min-height:0!important;padding:0!important;overflow:hidden}
.pc-trips-container{height:100%;min-height:0;display:flex;flex-direction:column}
.pc-trips-scroll-region{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;padding:8px 20px 28px;overscroll-behavior-y:contain;scroll-snap-type:y mandatory;scroll-padding:8px 0 28px;-webkit-overflow-scrolling:touch}
.pc-trips-scroll-region:focus-visible{outline:2px solid #c9ff62;outline-offset:-2px}
.pc-trips-grid{display:grid!important;grid-template-columns:1fr!important;gap:20px}.pc-trip-card{scroll-snap-align:end;scroll-snap-stop:always}
.pc-trips-scroll-region .pc-trip-card:hover,.pc-trips-scroll-region .pc-trip-card:focus-within{transform:none}
.pc-box-workbench{display:flex!important;flex-direction:column;gap:20px}.pc-box-content{width:100%!important;padding-bottom:calc(var(--mobile-bottom) + 178px)!important}.pc-box-sections{width:100%;gap:16px}.pc-box-section .ant-card-body{padding:22px 18px!important}.pc-box-section-title{font-size:19px!important}
.pc-box-two-column{grid-template-columns:1fr!important;gap:24px!important}.pc-box-options.ant-tag-checkable-group{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important}.pc-box-options .ant-tag{width:100%!important;min-width:0!important;padding-inline:6px!important;font-size:13px!important;line-height:18px!important;min-height:50px!important;white-space:normal!important;text-align:center}.pc-box-option-label{display:inline-block;white-space:normal}.pc-box-group-budget .ant-tag{min-height:58px!important}.pc-box-group-budget .pc-box-option-label{max-width:2.2em;line-height:1.4}.pc-box-group-surprise .pc-box-options.ant-tag-checkable-group{grid-template-columns:1fr!important}
.pc-box-visual{width:100%;order:-1;min-height:0!important}.pc-box-visual-image{height:180px!important}.pc-box-visual-copy,.pc-box-visual-signals,.pc-box-visual-range{display:none!important}
.pc-box-action{position:fixed!important;z-index:115;left:20px;right:20px;bottom:calc(var(--mobile-bottom) + 10px)!important;width:auto!important;margin:0!important;padding:14px!important;display:flex!important;flex-direction:column;gap:12px;border-radius:20px!important}.pc-box-summary{min-width:0;width:100%}.pc-box-summary-value{display:block;overflow:hidden;font-size:13px!important;line-height:20px!important;text-overflow:ellipsis;white-space:nowrap}.pc-box-action-buttons,.pc-box-action-buttons .ant-space-item,.pc-box-start-button{width:100%!important}.pc-box-start-button{height:54px!important}
.pc-trips-toolbar{flex:none;align-items:center!important;flex-direction:row!important;gap:8px;margin:0!important;padding:12px 16px;border-bottom:1px solid #ffffff14;background:#0d1012}
.pc-trips-segmented.ant-segmented{flex:1;min-width:0;width:auto!important;height:44px;padding:4px}
.pc-trips-segmented .ant-segmented-item,.pc-trips-segmented .ant-segmented-item-label{min-height:36px!important;line-height:36px!important;font-size:12px!important}
.pc-trips-toolbar-actions.ant-space{display:none!important}
.pc-trips-mobile-menu.ant-btn{display:inline-flex;flex:none;width:40px;height:44px;padding:0;border:1px solid #ffffff18;border-radius:14px;background:#161b18;color:#bec7b9;font-size:20px}
.pc-trips-mobile-menu.is-editing{color:#c9ff62;border-color:#c9ff6270;background:#c9ff6212}
.pc-trips-manage-popup .ant-dropdown-menu{min-width:176px;padding:6px;border:1px solid #ffffff22;border-radius:16px;background:#171d18;box-shadow:0 16px 42px #0006}
.pc-trips-manage-popup .ant-dropdown-menu-item{min-height:44px;border-radius:10px;color:#e0e7d9!important}.pc-trips-manage-popup .ant-dropdown-menu-item:hover{background:#c9ff6214!important;color:#c9ff62!important}
.pc-trips-toolbar-actions .ant-space-item{min-width:0}
.pc-trips-toolbar-actions .ant-btn{width:100%!important;height:44px!important;padding-inline:8px!important;font-size:13px}
.pc-trip-card .ant-card-body{position:relative;display:flex!important;flex-direction:column;min-height:0}.pc-trip-cover{height:230px!important;min-height:230px!important}.pc-trip-overflow,.pc-trip-date,.pc-trip-title-row .pc-trip-status{display:none!important}.pc-trip-mobile-corner-meta{position:absolute;z-index:7;top:16px;right:16px;min-width:92px;padding:11px 13px 10px;border:1px solid rgba(255,255,255,.18);border-radius:15px;display:grid;gap:8px;color:#fff;background:rgba(8,11,9,.76);box-shadow:0 9px 24px rgba(0,0,0,.24);backdrop-filter:blur(12px)}.pc-trip-mobile-corner-meta time{padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,.13);color:#c9ff62;font:900 16px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:-.04em;white-space:nowrap}.pc-trip-mobile-status{display:flex;align-items:center;gap:7px;color:#f4d277;font-size:12px;font-weight:850;white-space:nowrap}.pc-trip-mobile-status i{width:7px;height:7px;border-radius:50%;background:currentColor;box-shadow:0 0 9px currentColor}.pc-trip-mobile-status.is-progress{color:#84c8ff}.pc-trip-mobile-status.is-completed{color:#c9ff62}.pc-trip-mobile-status.is-cancelled{color:#aaaab3}.pc-trip-content{padding:22px 18px!important;min-height:0!important}.pc-trip-title-row{gap:10px;flex-wrap:wrap}.pc-trip-title.ant-typography{font-size:24px!important}.pc-trip-meta{grid-template-columns:repeat(2,minmax(0,1fr))!important}.pc-trip-meta-item:last-child{grid-column:auto!important}.pc-trip-progress{margin:0 16px 16px;padding:18px 14px}.pc-trip-progress-step strong{font-size:12px!important}
.pc-destinations-page .ant-row{row-gap:16px!important}.pc-destinations-page .ant-col{max-width:100%}.pc-destinations-page input{font-size:16px}
.pc-destinations-grid{grid-template-columns:1fr!important}.pc-destinations-filters{background:#111611!important;border-color:#ffffff18!important}.pc-destinations-filters .ant-segmented{background:#1b2318!important}.pc-destinations-filters .ant-segmented-item{color:#bbc5b5}.pc-destinations-filters .ant-segmented-item-selected{color:#11150d}
.travel-slot-page{height:calc(100dvh - var(--mobile-bottom))!important;min-height:0!important;overflow:hidden}.travel-slot-stage{height:100%!important;min-height:0!important}.travel-slot-result-body{grid-template-columns:1fr!important;overflow-y:auto;max-height:55dvh}.travel-slot-result-media{max-height:180px}.travel-slot-result-copy{padding:16px!important}.travel-slot-result-copy h2{font-size:24px!important}.travel-slot-result-actions{display:flex;flex-wrap:wrap;gap:10px}.travel-slot-result-actions button{min-height:44px;flex:1}
.itinerary-detail-page{height:calc(100dvh - var(--mobile-bottom));min-height:0!important;overflow-y:auto;overflow-x:hidden;padding-bottom:24px}.itinerary-detail-nav{height:68px!important;padding:0 18px!important;gap:10px}.itinerary-detail-nav>button:first-child{font-size:13px!important}.itinerary-detail-nav .itinerary-primary.compact{display:inline-flex!important;height:40px;padding:0 12px;font-size:12px!important}
.itinerary-detail-hero{height:500px}.itinerary-detail-title{left:20px;top:80px;width:calc(100% - 40px)}.itinerary-detail-title h1{font-size:38px!important;line-height:1.15}.itinerary-detail-title p{font-size:15px;line-height:1.6}.itinerary-hero-stats{left:20px;right:20px;bottom:20px;gap:20px}
.itinerary-favorite{right:20px!important;top:18px!important;width:48px!important;min-width:48px!important;height:48px!important;padding:0!important}.itinerary-favorite span{display:none}.itinerary-favorite svg{width:23px;height:23px}.itinerary-favorite-error{right:20px!important;top:72px!important;max-width:220px;text-align:right}
.itinerary-detail-body{width:auto;margin:0 20px;padding:30px 0;display:flex;flex-direction:column;gap:32px}.itinerary-detail-body>aside{display:grid;grid-template-columns:1fr;gap:12px}.itinerary-aside-card:last-child{display:block}.itinerary-aside-card{padding:20px}.itinerary-body-title{gap:12px;margin-bottom:32px}.itinerary-body-title h2{font-size:27px}.itinerary-stop-copy{min-width:0}.itinerary-photo-strip{height:180px;overflow:hidden;grid-template-rows:minmax(0,1fr)}.itinerary-photo-strip img{min-height:0;max-height:100%;display:block}.itinerary-finish-card{padding:24px}.itinerary-finish-card h3{font-size:23px}
.pc-quick-draw-modal-root .ant-modal{max-width:calc(100vw - 24px);margin:12px auto}.pc-quick-draw-content{padding:28px 20px!important}.pc-quick-draw-content h2.ant-typography{font-size:28px!important}
.auth-gate{padding:84px 18px 30px!important;overflow:auto!important}.auth-gate-card{box-sizing:border-box!important;max-width:100%!important}.auth-gate-form input{font-size:16px!important}
}
@media(prefers-reduced-motion:reduce){.mobile-bottom-nav *{transition:none!important}}
`}</style>;
}
