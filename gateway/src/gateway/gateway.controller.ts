import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('System')
@Controller()
export class GatewayController {
  @ApiOperation({ summary: 'Проверка состояния gateway' })
  @ApiResponse({ status: 200, description: 'Gateway работает' })
  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
