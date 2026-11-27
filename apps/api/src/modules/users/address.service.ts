import mongoose from 'mongoose';
import { AddressModel, IAddress, AddressType } from './address.model.js';
import { UserModel } from './user.model.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../common/errors/app-error.js';
import { MapsService } from '../location/maps.service.js';

export interface CreateAddressDTO {
  fullName: string;
  phone: string;
  houseFlat: string;
  apartmentStreet: string;
  areaLocality: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  addressType?: AddressType;
  deliveryInstructions?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export interface ServiceabilityResult {
  isServiceable: boolean;
  pincode: string;
  estimatedMinutes: number;
  deliveryFeePaise: number;
  freeDeliveryThresholdPaise: number;
  message: string;
}

// Serviceable PIN code prefixes in quick-commerce operational zones
const BLOCKED_OR_REMOTE_PINCODES = ['000000', '999999'];

export class AddressService {
  public static async getUserAddresses(userId: string): Promise<IAddress[]> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    return AddressModel.find({ userId: userObjectId }).sort({ isDefault: -1, createdAt: -1 });
  }

  public static async getAddressById(addressId: string, userId: string): Promise<IAddress> {
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      throw new BadRequestError('Invalid address ID format');
    }

    const address = await AddressModel.findById(addressId);
    if (!address) {
      throw new NotFoundError('Address not found');
    }

    if (address.userId.toString() !== userId) {
      throw new ForbiddenError('You do not have access to this address');
    }

    return address;
  }

  public static async createAddress(userId: string, input: CreateAddressDTO): Promise<IAddress> {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Validate pincode format (6 digits)
    if (!/^[1-9][0-9]{5}$/.test(input.pincode)) {
      throw new BadRequestError('PIN code must be a valid 6-digit Indian postal code');
    }

    // Try geocoding coordinates if not supplied
    let lat = input.latitude;
    let lng = input.longitude;
    if ((lat === undefined || lng === undefined) && input.areaLocality && input.city) {
      try {
        const geo = await MapsService.geocode(`${input.houseFlat} ${input.apartmentStreet} ${input.areaLocality} ${input.city} ${input.pincode}`);
        if (geo) {
          lat = geo.latitude;
          lng = geo.longitude;
        }
      } catch {}
    }

    const serviceCheck = await MapsService.checkServiceability(lat, lng, input.pincode);
    const isServiceable = serviceCheck.isServiceable;

    // Check if user has any existing addresses
    const count = await AddressModel.countDocuments({ userId: userObjectId });
    const isFirst = count === 0;
    const isDefault = Boolean(input.isDefault || isFirst);

    // If marked as default, unset other default flags
    if (isDefault) {
      await AddressModel.updateMany({ userId: userObjectId }, { isDefault: false });
    }

    const address = await AddressModel.create({
      userId: userObjectId,
      fullName: input.fullName.trim(),
      phone: input.phone.trim(),
      houseFlat: input.houseFlat.trim(),
      apartmentStreet: input.apartmentStreet.trim(),
      areaLocality: input.areaLocality.trim(),
      landmark: input.landmark?.trim(),
      city: input.city.trim(),
      state: input.state.trim(),
      pincode: input.pincode.trim(),
      addressType: input.addressType || 'HOME',
      deliveryInstructions: input.deliveryInstructions?.trim(),
      latitude: lat,
      longitude: lng,
      isDefault,
      isServiceable,
    });

    if (isDefault) {
      await UserModel.findByIdAndUpdate(userObjectId, { defaultAddressId: address._id });
    }

    return address;
  }

  public static async updateAddress(
    addressId: string,
    userId: string,
    input: Partial<CreateAddressDTO>
  ): Promise<IAddress> {
    const address = await this.getAddressById(addressId, userId);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    if (input.pincode) {
      if (!/^[1-9][0-9]{5}$/.test(input.pincode)) {
        throw new BadRequestError('PIN code must be a valid 6-digit Indian postal code');
      }
      address.pincode = input.pincode.trim();
      address.isServiceable = !BLOCKED_OR_REMOTE_PINCODES.includes(input.pincode);
    }

    if (input.fullName !== undefined) address.fullName = input.fullName.trim();
    if (input.phone !== undefined) address.phone = input.phone.trim();
    if (input.houseFlat !== undefined) address.houseFlat = input.houseFlat.trim();
    if (input.apartmentStreet !== undefined) address.apartmentStreet = input.apartmentStreet.trim();
    if (input.areaLocality !== undefined) address.areaLocality = input.areaLocality.trim();
    if (input.landmark !== undefined) address.landmark = input.landmark.trim();
    if (input.city !== undefined) address.city = input.city.trim();
    if (input.state !== undefined) address.state = input.state.trim();
    if (input.addressType !== undefined) address.addressType = input.addressType;
    if (input.deliveryInstructions !== undefined) address.deliveryInstructions = input.deliveryInstructions.trim();
    if (input.latitude !== undefined) address.latitude = input.latitude;
    if (input.longitude !== undefined) address.longitude = input.longitude;

    if (input.isDefault) {
      await AddressModel.updateMany({ userId: userObjectId }, { isDefault: false });
      address.isDefault = true;
      await UserModel.findByIdAndUpdate(userObjectId, { defaultAddressId: address._id });
    }

    await address.save();
    return address;
  }

  public static async deleteAddress(addressId: string, userId: string): Promise<void> {
    const address = await this.getAddressById(addressId, userId);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    await AddressModel.findByIdAndDelete(address._id);

    // If deleted address was default, promote another address to default if one exists
    if (address.isDefault) {
      const nextAddress = await AddressModel.findOne({ userId: userObjectId }).sort({ createdAt: -1 });
      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save();
        await UserModel.findByIdAndUpdate(userObjectId, { defaultAddressId: nextAddress._id });
      } else {
        await UserModel.findByIdAndUpdate(userObjectId, { $unset: { defaultAddressId: 1 } });
      }
    }
  }

  public static async setDefaultAddress(addressId: string, userId: string): Promise<IAddress> {
    const address = await this.getAddressById(addressId, userId);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    await AddressModel.updateMany({ userId: userObjectId }, { isDefault: false });
    address.isDefault = true;
    await address.save();

    await UserModel.findByIdAndUpdate(userObjectId, { defaultAddressId: address._id });
    return address;
  }

  public static async checkServiceability(
    pincode?: string,
    latitude?: number,
    longitude?: number
  ): Promise<ServiceabilityResult> {
    const res = await MapsService.checkServiceability(latitude, longitude, pincode);
    return {
      isServiceable: res.isServiceable,
      pincode: res.pincode || pincode || '',
      estimatedMinutes: res.estimatedMinutes,
      deliveryFeePaise: res.deliveryFeePaise,
      freeDeliveryThresholdPaise: res.freeDeliveryThresholdPaise,
      message: res.message,
    };
  }
}
