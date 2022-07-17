import puppeteer from 'puppeteer';
import 'dotenv/config';
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

	await page.goto('https://gofile.io/d/ypwF1Z', { waitUntil: 'networkidle0' }).then(() => console.log('page loaded'));

	const element = await page.waitForSelector('#rowFolder-tableContent');

	const data = await element.evaluate((el) => {
		const arr = [];

		for (const child of Array.from(el.childNodes) as Element[]) {
			if (child.id != null) {
				arr.push((Array.from(Array.from(child.childNodes)[3].childNodes)[1] as Element).getAttribute('href'));
			}
		}

		return arr;
	});

	console.log(data.join('\n'));
};

scrape();
