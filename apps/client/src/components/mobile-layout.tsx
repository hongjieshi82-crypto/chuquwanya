export function MobileLayoutStyles() {
  return <style>{`
.mobile-bottom-nav{display:none}
@media(max-width:760px){
html,body,#root{background:#090b09;overscroll-behavior-y:none}
body{--mobile-bottom:calc(70px + env(safe-area-inset-bottom,0px))}
.mobile-bottom-nav{position:fixed;z-index:120;bottom:0;left:0;right:0;display:grid;grid-template-columns:repeat(4,1fr);height:var(--mobile-bottom);padding:5px 12px calc(5px + env(safe-area-inset-bottom,0px));border-top:1px solid #ffffff14;background:rgba(12,16,13,.96);backdrop-filter:blur(20px)}
.mobile-bottom-nav button{border:0;background:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;min-height:48px;touch-action:manipulation}
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
.pc-box-workbench{display:flex!important;flex-direction:column;gap:20px}.pc-box-sections{width:100%;gap:16px}.pc-box-section .ant-card-body{padding:22px 18px!important}.pc-box-section-title{font-size:19px!important}
.pc-box-two-column{grid-template-columns:1fr!important;gap:24px!important}.pc-box-options.ant-tag-checkable-group{gap:8px!important}.pc-box-options .ant-tag{min-width:0!important;flex:1;padding-inline:10px!important;font-size:14px!important;min-height:46px!important}
.pc-box-visual{width:100%;order:-1;min-height:0!important}.pc-box-visual-image{height:180px!important}.pc-box-visual-copy,.pc-box-visual-signals,.pc-box-visual-range{display:none!important}
.pc-box-action{padding:18px!important;display:flex!important;flex-direction:column;gap:16px}.pc-box-summary-value{font-size:13px!important}.pc-box-action-buttons,.pc-box-action-buttons .ant-space-item,.pc-box-start-button{width:100%!important}.pc-box-start-button{height:54px!important}
.pc-trips-toolbar{align-items:stretch!important;flex-direction:column;gap:16px}.pc-trips-segmented{width:100%!important}.pc-trips-toolbar-actions{display:flex;justify-content:flex-end}.pc-trips-toolbar-actions .ant-btn{height:44px;padding-inline:14px;font-size:13px}
.pc-trip-card .ant-card-body{display:flex!important;flex-direction:column;min-height:0}.pc-trip-cover{height:230px!important;min-height:230px!important}.pc-trip-content{padding:22px 18px!important;min-height:0!important}.pc-trip-title-row{gap:10px;flex-wrap:wrap}.pc-trip-title.ant-typography{font-size:24px!important}.pc-trip-meta{grid-template-columns:repeat(2,minmax(0,1fr))!important}.pc-trip-meta-item:last-child{grid-column:auto!important}.pc-trip-progress{margin:0 16px 16px;padding:18px 14px}.pc-trip-progress-step strong{font-size:12px!important}
.pc-destinations-page .ant-row{row-gap:16px!important}.pc-destinations-page .ant-col{max-width:100%}.pc-destinations-page input{font-size:16px}
.pc-destinations-grid{grid-template-columns:1fr!important}.pc-destinations-filters{background:#111611!important;border-color:#ffffff18!important}.pc-destinations-filters .ant-segmented{background:#1b2318!important}.pc-destinations-filters .ant-segmented-item{color:#bbc5b5}.pc-destinations-filters .ant-segmented-item-selected{color:#11150d}
.travel-slot-page{height:calc(100dvh - var(--mobile-bottom))!important;min-height:0!important;overflow:hidden}.travel-slot-stage{height:100%!important;min-height:0!important}.travel-slot-result-body{grid-template-columns:1fr!important;overflow-y:auto;max-height:55dvh}.travel-slot-result-media{max-height:180px}.travel-slot-result-copy{padding:16px!important}.travel-slot-result-copy h2{font-size:24px!important}.travel-slot-result-actions{display:flex;flex-wrap:wrap;gap:10px}.travel-slot-result-actions button{min-height:44px;flex:1}
.itinerary-detail-page{height:calc(100dvh - var(--mobile-bottom));min-height:0!important;overflow-y:auto;overflow-x:hidden;padding-bottom:24px}.itinerary-detail-nav{height:68px!important;padding:0 18px!important;gap:10px}.itinerary-detail-nav>button:first-child{font-size:13px!important}.itinerary-detail-nav .itinerary-primary.compact{display:inline-flex!important;height:40px;padding:0 12px;font-size:12px!important}
.itinerary-detail-hero{height:500px}.itinerary-detail-title{left:20px;top:80px;width:calc(100% - 40px)}.itinerary-detail-title h1{font-size:38px!important;line-height:1.15}.itinerary-detail-title p{font-size:15px;line-height:1.6}.itinerary-hero-stats{left:20px;right:20px;bottom:20px;gap:20px}
.itinerary-detail-body{width:auto;margin:0 20px;padding:30px 0;display:flex;flex-direction:column;gap:32px}.itinerary-detail-body>aside{display:grid;grid-template-columns:1fr;gap:12px}.itinerary-aside-card:last-child{display:block}.itinerary-aside-card{padding:20px}.itinerary-body-title{gap:12px;margin-bottom:32px}.itinerary-body-title h2{font-size:27px}.itinerary-stop-copy{min-width:0}.itinerary-photo-strip{height:180px;overflow:hidden;grid-template-rows:minmax(0,1fr)}.itinerary-photo-strip img{min-height:0;max-height:100%;display:block}.itinerary-finish-card{padding:24px}.itinerary-finish-card h3{font-size:23px}
.pc-quick-draw-modal-root .ant-modal{max-width:calc(100vw - 24px);margin:12px auto}.pc-quick-draw-content{padding:28px 20px!important}.pc-quick-draw-content h2.ant-typography{font-size:28px!important}
.auth-gate{padding:84px 18px 30px!important;overflow:auto!important}.auth-gate-card{box-sizing:border-box!important;max-width:100%!important}.auth-gate-form input{font-size:16px!important}
}
@media(prefers-reduced-motion:reduce){.mobile-bottom-nav *{transition:none!important}}
`}</style>;
}
