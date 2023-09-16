const express = require('express');

const { param, body, validationResult } = require('express-validator');

const request = require('request');

const axios = require('axios');

const router = express.Router();

const baseUrl = "https://bhaveshnetflix.live/";

let selectFunction = (item) => {
  let options = {
    method: "POST",
    url: baseUrl + "select.php",
    formData: {
      select_query: item,
    },
  };
  return options;
};

router.get('/video/:id',
	[
		param('id')
      .trim()
      .notEmpty()
      .withMessage('ID Required')
      .matches(/^[0-9]*$/)
      .withMessage('Only Characters with numbers are allowed'),
    body('email')
    	.trim()
			.notEmpty()
			.withMessage('Email Address required')
			.normalizeEmail()
			.isEmail()
			.withMessage('Invalid email'),
	],
	async (req, res, next) => {
		const { id } = req.params;

		const { email } = req.body;

		const videoArray = [];

		const langArray = [];

		const fileCodeArray = [];

		// console.log(id);

		let opt1 = selectFunction(
			"select no_of_days from users where email = '"
				.concat(`${email}`)
				.concat("'")
		);

		// console.log(opt1);

		try {
			const error = validationResult(req);

			if (!error.isEmpty()) {
				// console.log(error.array());
				return res.json({
					isSuccess: false,
					videoUrl: "",
					errorMessage: error.array()[0].msg
				})
			}

			else {
				request(opt1, (error, response) => {
          if (error) throw new Error(error);
					else {
						let y = JSON.parse(response.body);

						// console.log(y);

						if (y.length >= 1 && Number(y[0].no_of_days) >= 0) {
							const noOfDays = Number(y[0].no_of_days);

							// console.log(noOfDays);

							let opt2 = selectFunction(
								"select * from videos where video_id = '"
									.concat(`${id}`)
									.concat("'")
							);

							request(opt2, (error, response) => {
								if (error) throw new Error(error);
					      else {
					       	let x = JSON.parse(response.body);

					       	// console.log(x);

					       	if (x.length >= 1) {
					       		x.forEach(async (i) => {
					       			const lang = i.lang;
					       			const video = i.video_url;

					       			langArray.push(lang);

					       			if (video !== '') {
					       				const regex = /\/([^/]+)$/; // Matches the last part of the URL after the last "/"

												const match = video.match(regex);

												if (match) {
												  const extractedString = match[1];
												  const fileCode = extractedString;

												  // console.log(fileCode);

												  fileCodeArray.push({ lang: i.lang, fileCode: fileCode });
												}
					       			}
					       			else {
												fileCodeArray.push({ lang: i.lang, fileCode: '' });
					       			}
					       		});

					       		// console.log(fileCodeArray);

					       		Promise.all(fileCodeArray.map(i => {
										    const url = `https://uptobox.com/api/streaming?token=45701da784b02110e845cb7b8a8872577d32q&file_code=${i.fileCode}`;

										    const opt3 = {
										      'method': 'GET',
										      'headers': {
					    							accept: 'application/json',
										      }
										    };

										    return axios.get(url, opt3) // Pass your options object as the second argument
									        .then(response => {
									        		// console.log(response.data);
									            // Assuming the response contains JSON data
									            return { ...response.data, lang: i.lang };
									        })
									        .catch(error => {
									            console.log(error);
									            // Handle the error as needed
									            // return { error: 'An error occurred' }; // You can return an error object or some default value
									        });
										})).then(results => {
									    // console.log(results);

									    if (results.length > 1) {
									    	results.forEach(i => {
									    		if (i.statusCode === 0) {
										    		const videoUrl = i.data.streamLinks.src;
										    		const videoLang = i.lang;
										    		// console.log(videoUrl, videoLang);
										    		videoArray.push({ lang: videoLang, url: videoUrl });
										    	}
										    	else {
										    		videoArray.push({ lang: i.lang, url: 'No data found...' });
										    	}
									    	})
									    }

									    else {
										    const videoUrl = results.data.streamLinks.src;
									    	const videoLang = results.lang;
										    videoArray.push({ lang: videoLang, url: videoUrl });
										  }

									    // console.log(videoArray, langArray);

									    return res.json({
												isSuccess: true,
												langArray: langArray,
												videoUrl: videoArray,
												errorMessage: ""
											})
										});				        	
					       	}

					       	else {
					        	return res.json({
											isSuccess: false,
											langArray: "",
											videoUrl: "",
											errorMessage: "No data found..."
										})
					       	}
					      }
							})
						}
						else {
							return res.json({
								isSuccess: false,
								langArray: "",
								videoUrl: "",
								errorMessage: "No Subscription Found..."
							})
						}
					}
				})
			}
		}

		catch(error) {
			return res.json({
				isSuccess: false,
				langArray: "",
				videoUrl: "",
				errorMessage: "No data found..."
			})
		}
})

module.exports = router;
