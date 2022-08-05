const express = require("express");
const app = express();
const html = require("html-template-tag");

app.use(express.static("public"));

// 1. connect to database

const { application } = require("express");
const Sequelize = require("sequelize");
const client = new Sequelize(
  process.env.DATABASE_URL || "postgres://localhost/bookmarks_seq_db"
);

const Category = client.define("category", {
  name: { type: Sequelize.STRING },
});

const Bookmark = client.define("bookmark", {
  name: { type: Sequelize.STRING },
  url: { type: Sequelize.STRING },
});

// connect the two models
// one category can have many bookmarks
Bookmark.belongsTo(Category);

// 3.0 redirect "/" to "/bookmarks"

app.get("/", (req, res) => {
  res.redirect("/bookmarks");
});

// 3.1 get "/bookmarks"
app.get("/bookmarks", async (req, res, next) => {
  try {
    const bookmarks = await Bookmark.findAll({ include: [Category] });
    res.send(
      html`<html>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
          <link
            href="https://fonts.googleapis.com/css2?family=Montserrat&display=swap"
            rel="stylesheet"
          />
          <link rel="stylesheet" href="/styles.css" />
          <title>Bookmarks</title>
        </head>
        <body>
          <h1>Bookmarker</h1>
          <ul>
            ${bookmarks.map((bookmark) => {
              return `<li><a href="${bookmark.url}">${bookmark.name}</a> - <a href="/bookmarks/categories/${bookmark.categoryId}">${bookmark.category.name}</a></li>`;
            })}
          </ul>
        </body>
      </html>`
    );
  } catch (ex) {
    next(ex);
  }
});

// 4. get "/bookmarks/category"
app.get("/bookmarks/categories/:id", async (req, res, next) => {
  try {
    const bookmarks = await Bookmark.findAll({
      include: [Category],
      where: {
        categoryId: req.params.id,
      },
    });
    res.send(
      html`<html>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
          <link
            href="https://fonts.googleapis.com/css2?family=Montserrat&display=swap"
            rel="stylesheet"
          />
          <link rel="stylesheet" href="/styles.css" />
          <title>${bookmarks[0].category.name}</title>
        </head>
        <body>
          <h1>${bookmarks[0].category.name}</h1>
          <ul>
            ${bookmarks.map((bookmark) => {
              return `<li><a href="${bookmark.url}">${bookmark.name}</a></li>`;
            })}
          </ul>
          <a href="/bookmarks">Back to Bookmarks</a>
        </body>
      </html>`
    );
  } catch (ex) {
    next(ex);
  }
});

// 2. setup function

const setup = async () => {
  try {
    // client.sync will create the tables is postgres
    await client.sync({ force: true });

    // array destructuring to create categories
    const [code, search, jobs] = await Promise.all([
      Category.create({ name: "Coding" }),
      Category.create({ name: "Search" }),
      Category.create({ name: "Jobs" }),
    ]);

    // create bookmarks
    const [google, bing] = await Promise.all([
      Bookmark.create({
        name: "Google",
        url: "https://www.google.com/",
        categoryId: search.id,
      }),
      Bookmark.create({
        name: "Bing",
        url: "https://www.bing.com/",
        categoryId: search.id,
      }),
    ]);

    const [stackOverflow, mdn] = await Promise.all([
      Bookmark.create({
        name: "Stack Overflow",
        url: "https://www.stackoverflow.com/",
        categoryId: code.id,
      }),
      Bookmark.create({
        name: "MDN",
        url: "https://developer.mozilla.org/en-US/",
        categoryId: code.id,
      }),
    ]);

    const [linkedIn, indeed] = await Promise.all([
      Bookmark.create({
        name: "LinkedIn",
        url: "https://www.linkedin.com/",
        categoryId: jobs.id,
      }),
      Bookmark.create({
        name: "Indeed",
        url: "https://www.indeed.com/",
        categoryId: jobs.id,
      }),
    ]);

    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`listening on port ${port}`));
  } catch (ex) {
    console.log(ex);
  }
};
setup();
