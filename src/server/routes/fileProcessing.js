/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express = require('express');
const Reading = require('../models/Reading');
const moment = require('moment');
const streamBuffers = require('stream-buffers');
const multer = require('multer');
const streamToDB = require('../services/loadFromCsvStream');
const { insertMeters } = require('../services/readMamacMeters');
const authenticator = require('./authenticator');
const validate = require('jsonschema').validate;
const csv = require('csv');
const promisify = require('es6-promisify');
const parseCsv = promisify(csv.parse);


const router = express.Router();

// The upload here ensures that the file is saved to server RAM rather than disk
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticator);
router.post('/readings/:meterName/:cumulativeFlag/:reverseFlag/:intervalRange', upload.single('csvFile'), async (req, res) => {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['meter_id'],
		properties: {
			meter_id: {
				type: 'string',
				pattern: '^\\d+$'
			}
		}
	};
	if (!validate(req.params, validParams).valid) {
		res.sendStatus(400);
	} else {
		try {
			const rows = await parseCsv(req.file.buffer.toString());
			const reverse = req.params.reverseFlag;
			const interval = req.params.intervalRange;
			const meterName = req.params.meterName;
			const cumulative = req.params.cumulativeFlag;

			const rowArray = [];
			const readingArray = [];
			for(const row of rows){
				rowArray.push(row);
				if(!reverse){
					if(!cumulative){

					}
					else {

					}
				}
				else {
					if(!cumulative) {

					}
					else {

					}
				}
			}

			const id = parseInt(req.params.meter_id);
			const myReadableStreamBuffer = new streamBuffers.ReadableStreamBuffer({
				frequency: 10,
				chunkSize: 2048
			});
			myReadableStreamBuffer.put(req.file.buffer);
			// stop() indicates we are done putting the data in our readable stream.
			myReadableStreamBuffer.stop();
			try {
				await streamToDB(myReadableStreamBuffer, row => {
					const readRate = Number(row[0]);
					const endTimestamp = moment(row[1], 'MM/DD/YYYY HH:mm');
					const startTimestamp = moment(row[1], 'MM/DD/YYYY HH:mm').subtract(60, 'minutes');
					return new Reading(id, readRate, startTimestamp, endTimestamp);
				}, (readings, tx) => Reading.insertOrIgnoreAll(readings, tx));
				res.status(200).json({ success: true });
			} catch (e) {
				res.status(403).json({ success: false });
			}
		} catch (err) {
			res.status(400).send({
				success: false,
				message: 'Incorrect file type.'
			});
		}
	}
});

router.post('/readings/:meter_id', upload.single('csvFile'), async (req, res) => {
	const validParams = {
		type: 'object',
		maxProperties: 1,
		required: ['meter_id'],
		properties: {
			meter_id: {
				type: 'string',
				pattern: '^\\d+$'
			}
		}
	};
	if (!validate(req.params, validParams).valid) {
		res.sendStatus(400);
	} else {
		try {
			const id = parseInt(req.params.meter_id);
			const myReadableStreamBuffer = new streamBuffers.ReadableStreamBuffer({
				frequency: 10,
				chunkSize: 2048
			});
			myReadableStreamBuffer.put(req.file.buffer);
			// stop() indicates we are done putting the data in our readable stream.
			myReadableStreamBuffer.stop();
			try {
				await streamToDB(myReadableStreamBuffer, row => {
					const readRate = Number(row[0]);
					const endTimestamp = moment(row[1], 'MM/DD/YYYY HH:mm');
					const startTimestamp = moment(row[1], 'MM/DD/YYYY HH:mm').subtract(60, 'minutes');
					return new Reading(id, readRate, startTimestamp, endTimestamp);
				}, (readings, tx) => Reading.insertOrIgnoreAll(readings, tx));
				res.status(200).json({ success: true });
			} catch (e) {
				res.status(403).json({ success: false });
			}
		} catch (err) {
			res.status(400).send({
				success: false,
				message: 'Incorrect file type.'
			});
		}
	}
});

router.post('/meters', async (req, res) => {
	const validBody = {
		type: 'object',
		maxProperties: 1,
		required: ['meters'],
		properties: {
			meters: {
				type: 'array',
				uniqueItems: false,
				items: {
					type: 'string'
				}
			}
		}
	};
	if (!validate(req.body, validBody).valid) {
		res.sendStatus(400);
	} else {
		try {
			await insertMeters(req.body.meters.map(ip => ({ip})));
			res.status(200).json({success: true});
		} catch (err) {
			res.status(403).json({success: false});
		}
	}
});



module.exports = router;
