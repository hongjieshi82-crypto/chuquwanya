export function SiteFooter() {
  return <footer className="site-footer">
    <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">京ICP备2026046201号-2</a>
    <style>{`
      .site-footer{position:fixed;right:10px;bottom:7px;z-index:40;width:auto;max-width:calc(100vw - 20px);padding:0;background:transparent;color:rgba(168,176,165,.5);font:10px/1.3 system-ui,"PingFang SC","Microsoft YaHei",sans-serif;pointer-events:none}
      .site-footer a{display:block;padding:3px 5px;color:inherit;text-decoration:none;white-space:nowrap;pointer-events:auto}
      .site-footer a:hover{color:rgba(210,218,207,.78);text-decoration:underline}
      .site-footer a:focus-visible{outline:2px solid #c9ff62;outline-offset:3px;border-radius:4px}
      @media(max-width:760px){.site-footer{right:6px;bottom:calc(72px + env(safe-area-inset-bottom,0px));font-size:9px}.site-footer a{padding:2px 4px}}
      @media print{.site-footer{display:none}}
    `}</style>
  </footer>;
}
