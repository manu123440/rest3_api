const express = require('express');

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

router.get('/plans', (req, res, next) => {
  let opt1 = selectFunction(
    "select * from plan"
  );

  try {
    request(opt1, (error, response) => {
      if (error) throw new Error(error);

      else {
        let x = JSON.parse(response.body);

        // console.log(x);

        if (x.length >= 1) {
          const plans = x.map(i => {
            return {
              id: i.id,
              name: i.name,
              amount: i.amount,
              no_of_days: i.no_of_days
            }
          });

          return res.json({
            isSuccess: true,
            plans: plans,
            errorMessage: ""
          })
        }

        else {
          return res.json({
            isSuccess: false,
            plans: '',
            errorMessage: "No plans found..."
          })
        }
      }
    })
  }

  catch(error) {
    return res.json({
      isSuccess: false,
      plans: '',
      errorMessage: "Try again..."
    })
  }
})

module.exports = router;