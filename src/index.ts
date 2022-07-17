import puppeteer from 'puppeteer';
import 'dotenv/config';
import { writeFileSync } from 'fs';
import { MessageEmbed, WebhookClient, Util } from 'discord.js';

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
		defaultViewport: {
			height: 720,
			width: 1280,
		},
	});
	const page = await browser.newPage();

	await page.goto(url, { waitUntil: 'networkidle0' }).then(() => console.log('page loaded'));

	try {
		const element = await page.waitForSelector('#rowFolder-tableContent').then((res) => {
			console.log('selector found');
			return res;
		});

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

		writeFileSync(`./output/${rnd}.txt`, data.join('\n'));

		await browser.close();
		await client.send({ files: [`./output/${rnd}.txt`] });
	} catch (e) {
		console.log(`INVALID: ${rnd}`);

		await scrape();
	}
};

scrape();
