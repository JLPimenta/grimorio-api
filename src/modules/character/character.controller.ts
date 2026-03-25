import {Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Req, UseGuards} from '@nestjs/common';
import {CharacterService} from './character.service';
import {CreateCharacterDto} from './dto/create-character.dto';
import {UpdateCharacterDto} from './dto/update-character.dto';
import {OptionalJwtGuard} from "../auth/guards/optional-jwt.guard";
import {UserRecord} from "../../database/schema";

interface AuthRequest extends Request {
    user: UserRecord;
}

@Controller('characters')
export class CharacterController {
    constructor(private readonly service: CharacterService) {
    }

    @Get()
    @UseGuards(OptionalJwtGuard)
    findAll(@Req() req: AuthRequest) {
        return this.service.findAll(req.user.id);
    }

    @Get(':id')
    @UseGuards(OptionalJwtGuard)
    findOne(@Param('id') id: string, @Req() req: AuthRequest ) {
        return this.service.findById(id)
    }

    @Post()
    @UseGuards(OptionalJwtGuard)
    create(@Body() dto: CreateCharacterDto, @Req() req: AuthRequest) {
        return this.service.create(dto, req.user.id);
    }

    @Put(':id')
    @UseGuards(OptionalJwtGuard)
    update(@Param('id') id: string, @Body() dto: UpdateCharacterDto, @Req() req: AuthRequest) {
        return this.service.update(id, dto, req.user.id);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(OptionalJwtGuard)
    remove(@Param('id') id: string, @Req() req: AuthRequest) {
        return this.service.remove(id, req.user.id);
    }
}