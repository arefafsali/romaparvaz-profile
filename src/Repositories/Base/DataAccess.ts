const Sequelize = require("sequelize");
const chalk = require("chalk");
const path = require("path");
const fs = require("fs");
var MongoClient = require("mongodb").MongoClient;

class DataAccess {
  static ModelInstance: any;
  static Models: any = [];

  constructor() {}

  static async connect() {
    if (process.env.DATABASE_TYPE == "POSTGRESQL") {
      if (this.ModelInstance) return this.ModelInstance;
      this.connectToPostgres();
    } else if (process.env.DATABASE_TYPE == "MONGODB") {
      return new Promise((resolve, reject) => {
        if (DataAccess.ModelInstance) resolve(DataAccess.ModelInstance);
        else
          MongoClient.connect(
            process.env.DB_URL,
            { useNewUrlParser: true },
            function(err, client) {
              DataAccess.ModelInstance = client.db(process.env.DB_NAME);
              resolve(DataAccess.ModelInstance);
            }
          );
      });
    }
  }
  static async test() {
    console.log(chalk.cyan("DB Connection Starting..."));
    if (process.env.DATABASE_TYPE == "POSTGRESQL") await DataAccess.connect();
    else if (process.env.DATABASE_TYPE == "MONGODB")
      return new Promise((resolve, reject) => {
        DataAccess.connect().then(ModelInstance => {
          resolve(ModelInstance);
        });
      });
  }

  static async connectToPostgres() {
    var models = new Sequelize(
      "rotadb",
      process.env.DB_USERNAME,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_URL,
        dialect: "postgres",
        operatorsAliases: false,
        logging: false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );
    await models
      .authenticate()
      .then(() => {
        console.log(
          chalk.bold.green("Connection has been established successfully.")
        );
        const directoryPath = path.join("src", "Common", "Entities");
        fs.readdir(directoryPath, (err, files) => {
          //handling error
          if (err) return console.log("Unable to scan directory: " + err);
          //listing all files using forEach
          files.forEach(file => {
            // Do whatever you want to do with the file
            var modelName = file.split(".")[0].replace("Model", "");
            this.Models[modelName] = models["import"](
              path.join("../../Common/Entities/", file.replace(".ts", ".js"))
            );
          });
          Object.keys(DataAccess.Models).forEach(modelName => {
            if (DataAccess.Models[modelName].associate) {
              DataAccess.Models[modelName].associate(DataAccess.Models);
            }
          });
        });
      })
      .catch(err => {
        console.log(chalk.bold.red("Unable to connect to the database:", err));
      });
    // console.log(models);
    this.ModelInstance = models;
  }
}

export = DataAccess;
