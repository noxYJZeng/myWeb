(() => {
  "use strict";

  // Public website token from Cloudflare Web Analytics, not an account API key.
  // Leave empty to disable collection until the owner's dashboard is ready.
  const siteToken = "2240c987a47040919156107895db539f";

  const productionPage =
    location.protocol === "https:" &&
    location.hostname === "noxyjzeng.github.io" &&
    /^\/myWeb\/(?:index\.html|polaroids\.html)?$/.test(location.pathname);

  if (
    !productionPage ||
    !/^[a-f0-9]{32}$/i.test(siteToken) ||
    document.getElementById("cloudflare-web-analytics")
  ) {
    return;
  }

  const beacon = document.createElement("script");
  beacon.id = "cloudflare-web-analytics";
  beacon.type = "module";
  beacon.src = "https://static.cloudflareinsights.com/beacon.min.js";
  beacon.async = true;
  // Section links are navigation within a page, not additional page views.
  beacon.dataset.cfBeacon = JSON.stringify({ token: siteToken, spa: false });
  document.head.append(beacon);
})();
