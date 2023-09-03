const express = require('express');

const { body, validationResult } = require('express-validator');

const request = require('request');

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

let updateFunction = (item, item2) => {
  let options = {
      method: "POST",
      url: baseUrl + "update.php",
      formData: {
        update_query: item,
        select_query: item2,
      },
    };
    return options;
}

router.post('/notify', async (req, res, next) => {
  const email = req.query.email;
  const planId = req.query.plan;

  // console.log(req.query);

  try {
    let opt1 = selectFunction(
      "select * from users where email = '"
        .concat(`${email}`)
        .concat("'")
    );

    request(opt1, (error, response) => {
      if (error) throw new Error(error);
      else { 
        let y = JSON.parse(response.body);

        // console.log(y);

        if (y.length >= 1) {
            const id = y[0]['payment_id'];

            // console.log(id);

            if (id !== null) {
              const url = `https://api-sandbox.nowpayments.io/v1/payment/${id}`;

              const opt2 = {
                'method': 'GET',
                'url': url,
                'headers': {
                  'x-api-key': '5RBGE0W-0MTMWKD-KEHQK25-DX4Q6Q5'
                }
              };

              request(opt2, function (error, response) {
                if (error) throw new Error(error);
                else { 
                  let x = JSON.parse(response.body); 
                  // console.log(x);

                  if (x.hasOwnProperty('payment_id')) {
                    if (Number(x['payment_id']) === Number(id) && x['payment_status'] === 'finished') {
                      // const currentDate = new Date();
                      const currentDate = new Date(x['created_at']);
                      // console.log(currentDate);

                      // Convert the date to a MySQL-compatible datetime string
                      const subDate = currentDate.toISOString().slice(0, 19).replace('T', ' ');

                      // console.log(subDate);

                      const planId = x['order_id'];

                      let opt3 = selectFunction(
                        "select no_of_days from plan where id = '"
                          .concat(`${planId}`)
                          .concat("'")
                      );

                      request(opt3, (error, response) => {
                        if (error) throw new Error(error);
                        else { 
                          let z1 = JSON.parse(response.body);

                          // console.log(z1);

                          if (z1.length >= 1) {
                            let noOfDays = z1[0].no_of_days;

                            // console.log(noOfDays);

                            let opt2 = updateFunction(
                              "update users set sub_date = '"
                                .concat(`${subDate}`)
                                .concat("', paid = 'true', plan_id = '")
                                .concat(`${planId}`)
                                .concat("', no_of_days = '")
                                .concat(`${noOfDays}`)
                                .concat("', status = 'active', payment_id = 'null' where email = '")
                                .concat(`${email}`)
                                .concat("'"),
                              "select * from users where email = '"
                                .concat(`${email}`)
                                .concat("'")
                            );

                            request(opt2, function (error, response) {
                              if (error) throw new Error(error);
                              else { 
                                let z = JSON.parse(response.body);

                                // console.log(z);

                                if (z.length >= 1) {
                                  return res.json({
                                    isSuccess: true,
                                  })
                                }

                                else {
                                  return res.json({
                                    isSuccess: false,
                                  })
                                } 
                              }
                            });
                          }

                          else {
                            return res.json({
                              isSuccess: false,
                            })
                          }
                        }
                      })
                    }                   
                  }

                  else {
                    return res.json({
                      isSuccess: false,
                    })
                  }
                }
              });
            }

            else {
              return res.json({
                isSuccess: false,
              })
            } 
        }

        else {
          return res.json({
            isSuccess: false,
          })
        } 
      }
    })
  }
	catch(error) {
		return res.json({
      isSuccess: false
    })
	}
})

module.exports = router;