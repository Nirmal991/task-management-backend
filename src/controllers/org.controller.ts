import { RequestHandler } from "express";
import { AuthRequest, createOrgSchema } from "../lib";
import Organization from "../models/organization.model";

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
        const org = await Organization.create({
            name,
            domain,
            members: [{ user: req.user.id, role: "owner" }],
        })

        return res.status(200).json({
            message: "Organization created Successfully",
            data: org,
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
    const org = await Organization.findById(id).populate("members.user", "username email");
    if(!org){
        return res.status(404).json({message: "Organization not found"})
    }

    const isMember = org.members.some((m) => m.user.toString() === req.user!.id);
    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this organization" });
    }

    return res.json({ organization: org });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}