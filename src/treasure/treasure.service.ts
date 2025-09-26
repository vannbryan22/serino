// services/treasure.service.ts
import { FindOneOptions } from "typeorm";
import { AppDataSource } from "../data-source";
import { MoneyValue } from "../entity/MoneyValue";
import { Treasure } from "../entity/Treasure";

const EARTH_RADIUS_KM = 6371;

export class TreasureService {
  private repo = AppDataSource.getRepository(Treasure);
  private moneyValuesRepo = AppDataSource.getRepository(MoneyValue);

  async findNearby(
    centerLat: number,
    centerLng: number,
    maxDistanceKm: number,
    minValue?: number,
  ) {
    // Use QueryBuilder to apply Haversine in SQL
    const qb = this.repo
      .createQueryBuilder("treasure")
      .select([
        "treasure.id",
        "treasure.name",
        "treasure.latitude",
        "treasure.longitude",
      ])
      .addSelect(
        `( ${EARTH_RADIUS_KM} * acos(
            cos(radians(:lat)) *
            cos(radians(treasure.latitude)) *
            cos(radians(treasure.longitude) - radians(:lng)) +
            sin(radians(:lat)) *
            sin(radians(treasure.latitude))
          ) )`,
        "distance",
      )
      .setParameters({ lat: centerLat, lng: centerLng })
      .having("distance <= :maxDist")
      .setParameter("maxDist", maxDistanceKm);

    // only join money_values if minValue is provided
    if (!isNaN(minValue)) {
      qb.innerJoin("money_values", "mv", "mv.treasure_id = treasure.id")
        .andWhere("mv.amt >= :minValue")
        .groupBy("treasure.id") // Avoid duplicates from multiple mv rows
        .setParameter("minValue", minValue);
    }

    return qb.orderBy("distance", "ASC").getRawMany();
  }

  async findOne(options: FindOneOptions<Treasure>) {
    return await this.repo.findOne(options);
  }

  async finAllMoneyValues(treasureId: number) {
    const rows = await this.moneyValuesRepo.find({
      where: {
        treasure_id: treasureId,
      },
      select: ["treasure_id", "amt"],
    });

    return rows;
  }

  calculateDistanceInKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) {
    const toRad = (value: number) => (value * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const radLat1 = toRad(lat1);
    const radLat2 = toRad(lat2);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
  }

  async isWithinCollectionRange(
    userLat: number,
    userLng: number,
    treasureLat: number,
    treasureLng: number,
    maxDistanceMeters: number = 50,
  ) {
    const distanceInKm = this.calculateDistanceInKm(
      userLat,
      userLng,
      treasureLat,
      treasureLng,
    );
    const distanceInMeters = distanceInKm * 1000; // Convert km → meters
    return distanceInMeters <= maxDistanceMeters;
  }
}
