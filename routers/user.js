// DEPENDENCIES
const router = require("express").Router();
const routerUtil = require("../util/router.js");
const User = require("../models/User.js");
const multer = require("multer");

// CONSTANTS
const upload = multer({
  dest: '/tmp/'
});

// HELPERS
let setImageRoute = field => {
  router.patch("/users/:key/" + field, upload.single("image"), (req, res) => {
    req.body.image = req.file;
    req.checkParams("key", routerUtil.errors.missingErrorMessage).notEmpty();
    req.checkParams("key", routerUtil.errors.dbErrorMessage)
      .isAsyncFnTrue(User.exists);
    req.checkBody("image", routerUtil.errors.missingErrorMessage).notEmpty();
    req.checkBody("image", routerUtil.errors.formatErrorMessage).isValidFile();
    routerUtil.completeRequest(req, res, async params => {
      let user = await User.getByKey(params.key);
      return await user.setImage(field + "Url", params.image);
    });
  });
}

let getDataRoute = (field, validateFn, fetchFnKey) => {
  router.get("/users/:key/" + field, (req, res) => {
    req.checkParams("key", routerUtil.errors.missingErrorMessage).notEmpty();
    req.checkParams("key", routerUtil.errors.dbErrorMessage)
      .isAsyncFnTrue(User.exists);
    req.checkParams("key", "user does not have general info")
      .isAsyncFnTrue(validateFn);
    routerUtil.completeRequest(req, res, async params => {
      let user = await User.getByKey(params.key);
      return await user[fetchFnKey]();
    });
  });
}

let setDataRoute = (field, dataFields, setFnKey) => {
  router.patch("/users/:key/" + field, (req, res) => {
    req.checkParams("key", routerUtil.errors.missingErrorMessage).notEmpty();
    req.checkParams("key", routerUtil.errors.dbErrorMessage)
      .isAsyncFnTrue(User.exists);
    dataFields.forEach(f => {
      req.checkBody(f, routerUtil.errors.missingErrorMessage).notEmpty();
    });
    routerUtil.completeRequest(req, res, async params => {
      let user = await User.getByKey(params.key);
      return await user[setFnKey](params);
    });
  });
}

// ROUTES
router.get("/users/:key?", (req, res) => {
  req.checkQuery("key", routerUtil.errors.missingErrorMessage).notEmpty();
  req.checkQuery("key", routerUtil.errors.dbErrorMessage)
    .isAsyncFnTrue(User.exists);
  routerUtil.completeRequest(req, res, async params => {
    return await User.getByKey(params.key);
  });
});

router.post("/users", upload.single('image'), (req, res) => {
  req.body.image = req.file;
  req.checkBody("image", router.errors.missingErrorMessage).notEmpty();
  req.checkBody("image", router.errors.formatErrorMessage).isValidFile();
  req.checkBody("firstName", routerUtil.errors.missingErrorMessage).notEmpty();
  req.checkBody("lastName", routerUtil.errors.missingErrorMessage).notEmpty();
  req.checkBody("phoneNumber", routerUtil.errors.missingErrorMessage).notEmpty();
  req.checkBody("email", routerUtil.errors.missingErrorMessage).notEmpty();
  req.checkBody("password", routerUtil.errors.missingErrorMessage).notEmpty();
  routerUtil.completeRequest(req, res, User.create);
});

router.patch("/users/:key/medicalHistory", (req, res) => {
  req.checkParams("key", routerUtil.errors.missingErrorMessage).notEmpty();
  req.checkParams("key", routerUtil.errors.dbErrorMessage)
    .isAsyncFnTrue(User.exists);
  req.checkBody("medicalHistory", routerUtil.errors.missingErrorMessage).notEmpty();
  req.checkBody("medicalHistory", routerUtil.errors.formatErrorMessage).isNonEmptyArray();
  routerUtil.completeRequest(req, res, async params => {
    let user = await User.getByKey(params.key);
    await user.update({
      medicalHistory: params.medicalHistory
    });
    return params.medicalHistory;
  });
});

setImageRoute("photoId");
setImageRoute("insurance");

getDataRoute("generalInfo", User.hasGeneralInfo, "getGeneralInfo");
getDataRoute("locationInfo", User.hasLocationInfo, "getLocationInfo");

setDataRoute("generalInfo", [
  "dateOfBirth", "sex", "maritalStatus", "occupation"
], "setGeneralInfo");
setDataRoute("locationInfo", [
  "addressLine1", "addressLine2", "city", "state", "zipcode"
], "setLocationInfo");

router.get("/users/:key/appointments", (req, res) => {
  req.checkQuery("key", routerUtil.errors.missingErrorMessage).notEmpty();
  req.checkQuery("key", routerUtil.errors.dbErrorMessage)
    .isAsyncFnTrue(User.exists);
  routerUtil.completeRequest(req, res, async params => {
    let user = await User.getByKey(params.key);
    return await user.getAppointments();
  });
});

// EXPORTS
module.exports = router;
