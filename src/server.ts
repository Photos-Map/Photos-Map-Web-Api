import ExpressConfig from './express.config'

const app = ExpressConfig()
const PORT = process.env.PORT || 3000

app.listen(PORT, () => console.log(`Server Running on Port ${PORT}`))
