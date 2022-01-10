const sharp = require('sharp')

Parse.Cloud.define('hello', req => {
  req.log.info(req);
  return 'Hi';
});

Parse.Cloud.define('asyncFunction', async req => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  req.log.info(req);
  return 'Hi async';
});

Parse.Cloud.beforeSave('Landmark', async (req) => {
  const obj = req.object;
  const objOriginal = req.original;
  console.log(obj)
  const file = obj.get("photo");
  console.log('Fileeeeee', req.object, req.original)
  const condition = file && !file.equals(objOriginal.get("photo"));
  console.log(condition)
  if (condition) {

    Parse.Cloud.httpRequest({ url: file.url() })
      .then((res) => {

        sharp(res.buffer)
          .resize(250, 250, {
            fit: "fill",
          })
          .toBuffer()
          .then(async (dataBuffer) => {
            const data = { base64: dataBuffer.toString("base64") };

            const parseFile = new Parse.File(
              "photo_thumbnail",
              data
            );
            await parseFile.save({},{useMasterKey: true});
            await obj.save({ photo_thumb: parseFile }, {useMasterKey: true});
          })
          .catch((err) => {
            console.log("--Sharp-Error--", err);
          });

      })
      .catch((err) => {
        console.log("--HTTP-Request-Error--", err);
      });

  } else {
    console.log("--Photo was deleted or did not change--");
  }
});
