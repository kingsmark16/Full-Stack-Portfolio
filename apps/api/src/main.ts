import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { requestIdMiddleware } from './common/http/request-id.middleware'
import { ProblemDetailsFilter } from './common/http/problem-details.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.use(requestIdMiddleware)
  app.useGlobalFilters(new ProblemDetailsFilter())

  const port = Number(process.env.PORT) || 3001

  await app.listen(port)
}

void bootstrap()
