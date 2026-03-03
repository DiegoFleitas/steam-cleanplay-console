import { JSDOM } from "jsdom";

describe("index.html UI smoke test", () => {
  it("contains the main Cleanplay Console UI elements", async () => {
    const dom = await JSDOM.fromFile("public/index.html");
    const document = dom.window.document;

    const title = document.querySelector("title");
    expect(title?.textContent).toContain("Cleanplay Console");

    const textarea = document.querySelector("#input-players");
    expect(textarea).not.toBeNull();

    const button = document.querySelector("#button");
    expect(button).not.toBeNull();
    expect(button?.textContent).toMatch(/Wash away the cheats/i);
  });
});
