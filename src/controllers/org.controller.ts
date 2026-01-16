import { RequestHandler } from "express";
import { AuthRequest, createOrgSchema } from "../lib";
import Organization from "../models/organization.model";
import User from "../models/user.model";

export const isUserInOrg = async (userId: string, orgId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    return false;
  }

  return user.orgs.some((val) => val.orgId.toString() === orgId && val.joiningStatus === 'accepted')
}
//Create Org
export const createOrg: RequestHandler = async (req: AuthRequest,res)=>{

    //Authenticated Users only
    if(!req.user){
        return res.status(401).json({ message: "Unauthorized" });
    }
    // console.log(req.user);

    const { error, value} = createOrgSchema.validate(req.body, {abortEarly: false});
    if (error) {
    return res.status(400).json({
      message: "Validation error",
      errors: error.details.map((err) => err.message),
    });
  }
    const { name, domain } = value;

    try{
        const org = await Organization.create({name,domain})

        await User.findByIdAndUpdate(
          req.user.id,
          {
            $push: {
              orgs: {
                orgId: org._id,
                role: "owner",
                joiningStatus: "accepted",
              }
            }
          },
          {new: true}
        );

        return res.status(200).json({
            message: "Organization created Successfully",
            organization: org,
        });
    }catch(error){
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
}

//Get Org
export const getOrg: RequestHandler = async (req: AuthRequest,res) => {
    if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { id } = req.params;

  try {
    const org = await Organization.findById(id)
    if(!org){
        return res.status(404).json({message: "Organization not found"})
    }
    const inOrg = await isUserInOrg(req.user.id, id);
    if (!inOrg) {
      return res
        .status(403)
        .json({ message: "You are not a member of this organization" });
    }

    return res.json({ organization: org });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

// get all Members of org
export const getAllMembers: RequestHandler = async (
  req: AuthRequest,
  res
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { orgId } = req.params;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const isOwner = user.orgs.some(
      (o) =>
        o.orgId.toString() === orgId &&
        o.role === "owner" &&
        o.joiningStatus === "accepted"
    );

    if (!isOwner) {
      return res.status(403).json({
        message: "Only organization owners can view members",
      });
    }

    const members = await User.find({
      "orgs.orgId": orgId,
      "orgs.joiningStatus": "accepted",
    }).select("_id username email");

    return res.status(200).json({
      message: "Organization members fetched successfully",
      data: members,
    });
  } catch (error) {
    console.error("Get org members error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

