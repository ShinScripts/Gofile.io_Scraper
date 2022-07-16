import puppeteer from 'puppeteer';
import 'dotenv/config';
import { MessageEmbed, WebhookClient } from 'discord.js';

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

	await page.goto(url, { waitUntil: 'networkidle0' });

	await page
		.$eval('#rowError > div > div > h5', (e) => e.textContent === 'This file does not exist.')
		.then(async () => {
			await browser.close();
			console.log(`INVALID: ${url}`);
		})
		.catch(async () => {
			await browser.close();
			console.log(`VALID: ${url}`);
			await client.send({
				embeds: [
					new MessageEmbed()
						.setAuthor({ name: 'New URL found' })
						.setDescription(url)
						.setColor('RANDOM')
						.setTimestamp(),
				],
			});
		})
		.finally(async () => await scrape());
};

scrape();
