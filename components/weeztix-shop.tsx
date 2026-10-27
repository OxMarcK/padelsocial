"use client";

import Script from "next/script";

/** Weeztix ticketshop embed: the injector script swaps the `.ot-iframe` div
 * for the shop's iframe. `guid` is the shop id from the Weeztix embed code. */
export function WeeztixShop({ guid }: { guid: string }) {
  return (
    <>
      <div className="ot-iframe min-h-[320px]" data-ot-url={`https://shop.weeztix.com/${guid}`} data-ot-guid={guid} />
      <Script src="https://v1.widget.shop.weeztix.com/injector.js" strategy="afterInteractive" />
    </>
  );
}
