import { HttpStatus, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { requestIdMiddleware } from './common/http/request-id.middleware'
import { ProblemDetailsFilter } from './common/http/problem-details.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.use(requestIdMiddleware)
  app.useGlobalFilters(new ProblemDetailsFilter())
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    }),
  )

  const port = Number(process.env.PORT) || 3001

  await app.listen(port)
}

void bootstrap()
