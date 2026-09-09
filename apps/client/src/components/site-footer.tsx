export function SiteFooter() {
  return <footer className="site-footer">
    <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">京ICP备2026046201号-2</a>
    <span className="site-footer-separator" aria-hidden="true">|</span>
    <a href="https://beian.mps.gov.cn/#/query/webSearch?code=11011502040707" target="_blank" rel="noopener noreferrer">
      <img src="/gongan-beian.png" alt="" />
      京公网安备11011502040707号
    </a>
    <style>{`
      .site-footer{position:static;display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:12px 16px 16px;background:#0d0d13;color:rgba(168,176,165,.5);font:10px/1.35 system-ui,"PingFang SC","Microsoft YaHei",sans-serif}
      .site-footer a{display:inline-flex;align-items:center;gap:4px;color:inherit;text-decoration:none;white-space:nowrap}
      .site-footer img{width:13px;height:13px;object-fit:contain}
      .site-footer a:hover{color:rgba(210,218,207,.78);text-decoration:underline}
      .site-footer a:focus-visible{outline:2px solid #c9ff62;outline-offset:3px;border-radius:4px}
      @media(min-width:761px){.site-footer{box-sizing:border-box;height:30px;min-height:30px;padding:5px 12px;gap:6px;background:#0b0d10;color:rgba(168,176,165,.44);font-size:9px;line-height:1}.site-footer img{width:11px;height:11px}}
      @media(max-width:760px){.site-footer{flex-direction:column;gap:3px;padding:9px 10px 13px;font-size:9px}.site-footer-separator{display:none}}
      @media print{.site-footer{display:none}}
    `}</style>
  </footer>;
}
