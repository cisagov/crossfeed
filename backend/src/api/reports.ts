import {
  IsInt,
  IsPositive,
  IsString,
  IsIn,
  ValidateNested,
  isUUID,
  IsOptional,
  IsObject,
} from "class-validator";
import { Type } from "class-transformer";
import { Report, connectToDatabase } from "../models";
import { validateBody, wrapHandler, NotFound } from "./helpers";
import { SelectQueryBuilder } from "typeorm";

const PAGE_SIZE = parseInt(process.env.PAGE_SIZE ?? "") || 25;

class ReportFilters {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  severity?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  desc?: string;
}

class ReportSearch {
  @IsInt()
  @IsPositive()
  page: number = 1;

  @IsString()
  @IsIn(["title", "created", "severity", "state"])
  @IsOptional()
  sort: string = "name";

  @IsString()
  @IsIn(["ASC", "DESC"])
  order: "ASC" | "DESC" = "DESC";

  @Type(() => ReportFilters)
  @ValidateNested()
  @IsObject()
  @IsOptional()
  filters?: ReportFilters;

  filterResultQueryset(qs: SelectQueryBuilder<Report>) {
    if (this.filters?.title) {
      qs.andWhere("report.title ILIKE :title", {
        title: `%${this.filters.title}%`,
      });
    }
    if (this.filters?.severity) {
      qs.andWhere("report.severity=:severity", {
        severity: this.filters.severity,
      });
    }
    if (this.filters?.state) {
      qs.andWhere("report.state=:state", { state: this.filters.state });
    }
    if (this.filters?.desc) {
      qs.andWhere("report.desc ILIKE :desc", {
        desc: `%${this.filters.desc}%`,
      });
    }
    return qs;
  }

  async getResults() {
    const qs = Report.createQueryBuilder("report")
      .orderBy(`report.${this.sort}`, this.order)
      .offset(PAGE_SIZE * (this.page - 1))
      .limit(PAGE_SIZE);

    this.filterResultQueryset(qs);
    return await qs.getManyAndCount();
  }
}

export const list = wrapHandler(async (event) => {
  await connectToDatabase();
  const search = await validateBody(ReportSearch, event.body);
  const [result, count] = await search.getResults();
  return {
    statusCode: 200,
    body: JSON.stringify({
      result,
      count,
    }),
  };
});

export const get = wrapHandler(async (event) => {
  await connectToDatabase();
  const id = event.pathParameters?.reportId;
  if (!isUUID(id)) {
    return NotFound;
  }

  const result = await Report.findOne(id);

  return {
    statusCode: result ? 200 : 404,
    body: result ? JSON.stringify(result) : "",
  };
});
