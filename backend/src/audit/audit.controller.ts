import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { CreateAuditDto } from './dtos/create-audit.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../prisma/enums/user-role.enum';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private auditService: AuditService) {}

  // Ações que nascem no frontend (ex.: sorteio) são logadas através deste endpoint.
  @Post()
  create(@Body() dto: CreateAuditDto, @Req() req: any) {
    const user = req.user as { id: string; email?: string; role: UserRole };
    return this.auditService.register({
      usuario: { id: user.id, nome: '', papel: user.role },
      acao: dto.acao,
      entidade: dto.entidade ?? 'SISTEMA',
      entidadeId: dto.entidadeId,
      evento: dto.evento,
      campo: dto.campo,
      de: dto.de,
      para: dto.para,
      detalhe: dto.detalhe,
      origem: dto.origem,
    });
  }

  // Leitura do arquivo de log (conferência manual / futuros relatórios).
  @Get()
  list() {
    return this.auditService.readLog();
  }
}