const { test } = require("@playwright/test");

// Tira um print da tela atual e anexa ao teste (aparece no Allure e no relatório HTML)
async function evidencia(page, nome) {
  await test.step(`Evidência: ${nome}`, async () => {
    const print = await page.screenshot({ fullPage: true });
    await test.info().attach(nome, { body: print, contentType: "image/png" });
  });
}

module.exports = { evidencia };
