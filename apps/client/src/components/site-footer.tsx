export function SiteFooter() {
  return <footer className="site-footer">
    <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">京ICP备2026046201号-2</a>
    <style>{`
      .site-footer{flex-shrink:0;padding:20px 16px;text-align:center;background:#090b09;color:#a8b0a5;font:12px/1.6 system-ui,"PingFang SC","Microsoft YaHei",sans-serif}
      .site-footer a{display:inline-block;padding:8px;color:inherit;text-decoration:none}
      .site-footer a:hover{text-decoration:underline}
      .site-footer a:focus-visible{outline:2px solid #c9ff62;outline-offset:3px;border-radius:4px}
      @media(max-width:760px){.site-footer{padding-bottom:calc(86px + env(safe-area-inset-bottom,0px))}}
      @media print{.site-footer{display:none}}
    `}</style>
  </footer>;
}
