"use strict";

const fs = require("fs");
const path = require("path");

const dataFilePath = path.join(__dirname, "..", "data.json");

function readDataFromFile() {
  try {
    const data = fs.readFileSync(dataFilePath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error(err);
    return [];
  }
}

function writeDataToFile(data) {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error(err);
  }
}

function generateId() {
  return "_" + Math.random().toString(36).substr(2, 9);
}

module.exports = function (app) {
  app
    .route("/api/issues/:project")

    .get(function (req, res) {
      try {
        const project = req.params.project;
        const query = req.query;
        const data = readDataFromFile();
        const issues = data.filter((issue) => issue.project === project);

        const filteredIssues = issues.filter((issue) => {
          for (let key in query) {
            if (query.hasOwnProperty(key)) {
              if (key === "open") {
                if (query[key] === "true" && !issue[key]) {
                  return false;
                }
                if (query[key] === "false" && issue[key]) {
                  return false;
                }
              } else {
                if (issue[key] !== query[key]) {
                  return false;
                }
              }
            }
          }
          return true;
        });

        res.json(filteredIssues);
      } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
      }
    })

    .post(function (req, res) {
      try {
        const project = req.params.project;
        const {
          issue_title,
          issue_text,
          created_by,
          assigned_to,
          status_text,
        } = req.body;

        if (!issue_title || !issue_text || !created_by) {
          return res.json({ error: "required field(s) missing" });
        }

        const newIssue = {
          assigned_to: assigned_to || "",
          status_text: status_text || "",
          open: true,
          _id: generateId(),
          issue_title,
          issue_text,
          created_by,
          created_on: new Date().toISOString(),
          updated_on: new Date().toISOString(),
        };
        const data = readDataFromFile();
        data.push({
          ...newIssue,
          project,
        });
        writeDataToFile(data);
        res.json(newIssue);
      } catch (err) {
        console.error(err);
        res.status(400).send("Bad Request");
      }
    })

    .put(function (req, res) {
      try {
        const project = req.params.project;
        const {
          _id,
          issue_title,
          issue_text,
          created_by,
          assigned_to,
          status_text,
          open,
        } = req.body;

        if (!_id) {
          return res.json({ error: "missing _id" });
        }

        if (
          !issue_title &&
          !issue_text &&
          !created_by &&
          !assigned_to &&
          !status_text &&
          !open
        ) {
          return res.json({ error: "no update field(s) sent", _id: _id });
        }

        const data = readDataFromFile();
        const index = data.findIndex(
          (issue) => issue.project === project && issue._id === _id
        );
        if (index === -1) {
          return res.json({ error: "could not update", _id: _id });
        }

        if (issue_title) data[index].issue_title = issue_title;
        if (issue_text) data[index].issue_text = issue_text;
        if (created_by) data[index].created_by = created_by;
        if (assigned_to) data[index].assigned_to = assigned_to;
        if (status_text) data[index].status_text = status_text;
        if (open !== undefined) data[index].open = open;
        data[index].updated_on = new Date().toISOString();

        writeDataToFile(data);
        res.json({ result: "successfully updated", _id: _id });
      } catch (err) {
        console.error(err);
        res.status(400).send("Bad Request");
      }
    })

    .delete(function (req, res) {
      try {
        const project = req.params.project;
        const { _id } = req.body;

        if (!_id) {
          return res.json({ error: "missing _id" });
        }

        const data = readDataFromFile();
        const index = data.findIndex(
          (issue) => issue.project === project && issue._id === _id
        );
        if (index === -1) {
          return res.json({ error: "could not delete", _id: _id });
        }

        data.splice(index, 1);

        writeDataToFile(data);
        res.json({ result: "successfully deleted", _id: _id });
      } catch (err) {
        console.error(err);
        res.status(400).send("Bad Request");
      }
    });
};