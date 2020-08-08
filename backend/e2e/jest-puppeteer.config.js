module.exports = {
  launch: {
    headless: process.env.DEBUG === "true" ? false: true,
  },
  browseContext: "incognito"
}