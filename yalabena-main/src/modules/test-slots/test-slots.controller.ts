import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { TestSlotsService } from './test-slots.service';
import { CreateSlotDto } from '../placement-tests/dto/create-slot.dto';
// أضف حارس المصادقة أو الصلاحيات الخاص بمشروعك هنا إن وجد (مثل JwtAuthGuard)

@Controller('test-slots')
export class TestSlotsController {
  constructor(private readonly testSlotsService: TestSlotsService) {}

  @Get()
  findAll() {
    return this.testSlotsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.testSlotsService.findOne(id);
  }

  @Post()
  create(@Body() createSlotDto: CreateSlotDto) {
    return this.testSlotsService.create(createSlotDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: Partial<CreateSlotDto>) {
    return this.testSlotsService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.testSlotsService.remove(id);
  }
}