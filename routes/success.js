const express = require('express');

const { body, validationResult } = require('express-validator');

const request = require('request');

const router = express.Router();

router.get('/success', async (req, res, next) => {
	// const phone = req.query.order_id;

	// const replacedPhno = phone.replace(/_/g, " ").replace(/^(\d+)/, "+$1");

	// console.log(replacedPhno);

	return res.send("success");

	// try {}
	// catch(error) {}
})

module.exports = router;