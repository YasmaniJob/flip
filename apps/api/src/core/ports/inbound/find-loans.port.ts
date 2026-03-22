import { PaginationDto } from '../../../common/dto/pagination.dto';
import { PaginatedResult } from '../../../common/interfaces/paginated-result.interface';

export interface FindLoansPort {
    execute(institutionId: string, pagination: PaginationDto): Promise<PaginatedResult<any>>;
}
