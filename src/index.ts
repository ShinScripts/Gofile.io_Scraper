import puppeteer from 'puppeteer';
import 'dotenv/config';
import { writeFileSync } from 'fs';
import { WebhookClient } from 'discord.js';

const base = 'https://gofile.io/d/';
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const client = new WebhookClient({
	url: process.env.TOKEN,
});

const scrape = async function () {
	let rnd = '';
	for (let i = 0; i < 6; i++) {
		rnd += chars.charAt(Math.floor(Math.random() * chars.length));
	}

	const url = `${base}${rnd}`;

	const browser = await puppeteer.launch({
		headless: true,
		defaultViewport: null,
	});
	const page = await browser.newPage();

	await page.goto(url, { waitUntil: 'networkidle2' });

	try {
		const element = await page.waitForSelector('#rowFolder-tableContent');

		const data = await element.evaluate((el) => {
			const arr = [];

			for (const child of Array.from(el.childNodes) as Element[]) {
				if (child.id != null) {
					arr.push(
						(Array.from(Array.from(child.childNodes)[3].childNodes)[1] as Element).getAttribute('href')
					);
				}
			}

			return arr;
		});

		writeFileSync(`./output/${url}.txt`, data.join('\n'));

		await client.send({ files: [`./output/${url}.txt`] });
		return true;
	} catch (e) {
		console.log(`INVALID: ${rnd}`);
		return false;
	} finally {
		await browser.close();
	}
};

(async () => {
	let result = false;

	do {
		result = await scrape();
	} while (result !== true);
})();
