import { container, item, profile_picture_src } from "@lib/constants";
import { BulletinContext } from "@lib/hooks/useBulletin";
import { getPdfPreviewUrl, isValidUrl } from "@lib/utils";
import { Card, CardContent } from "@mui/material";
import { motion } from "motion/react";
import { useContext, useEffect } from "react";
import { FaDiamond } from "react-icons/fa6";
import { WelcomePageCompany } from "./WecomePage";

export default function MemberResume({ selection }: { selection: string }) {
  const { People } = useContext(BulletinContext);
  useEffect(() => {
    const name = People?.filter((person) => person.email.toString() === selection);
    document.title = `${
      name && name[0]
        ? name[0].first_name.toString() + " " + name[0].last_name.toString() + " | TESC Portal"
        : "Welcome | TESC Portal"
    }`;
  }, [People, selection]);

  return (
    <>
      {selection != "-1" ? (
        People?.map((daton) => {
          if (daton.email.toString() === selection)
            return (
              <motion.span
                className="w-full grid grid-cols-[70px_1fr] grid-rows-[70px_1fr] gap-4"
                variants={container}
                initial="hidden"
                animate="show"
              >
                <motion.img
                  variants={item}
                  src={profile_picture_src}
                  alt=""
                  className="h-full rounded-full object-cover aspect-square"
                />
                <motion.div
                  className="flex flex-col h-full justify-center relative"
                  variants={item}
                >
                  <div className="flex gap-1">
                    <h1 className="font-bold text-4xl">
                      {daton.first_name && daton.last_name
                        ? daton.first_name + " " + daton.last_name
                        : "Unknown"}
                    </h1>
                    <div className=" w-fit flex items-center h-full p-1 rounded-2xl relative font-bold gap-1 px-4 text-navy text-xl">
                      <FaDiamond className="text-lightBlue text-2xl" />
                      {daton.points}
                    </div>
                  </div>
                  <p className="text-lg text-[#898989]">{daton.email ? daton.email : "Unknown"}</p>
                </motion.div>
                <motion.div className="col-start-2 w-[95%] max-w-[800px] mx-auto" variants={item}>
                  {daton.resume_link &&
                    isValidUrl(daton.resume_link) &&
                    getPdfPreviewUrl(daton.resume_link).previewUrl && (
                      <Card className="flex-1 shadow-lg h-fit">
                        <CardContent className="h-full">
                          <iframe
                            src={getPdfPreviewUrl(daton.resume_link).previewUrl ?? undefined}
                            title="Resume PDF preview"
                            className="w-full aspect-[1/1.2] border rounded-md"
                          />
                        </CardContent>
                      </Card>
                    )}
                  <div className="flex w-full flex-row mt-10 justify-between flex-wrap-reverse gap-8">
                    <div className="w-max flex flex-col gap-2 ">
                      <div className="flex gap-2"></div>
                    </div>
                  </div>
                </motion.div>
              </motion.span>
            );
        })
      ) : (
        <WelcomePageCompany />
      )}
    </>
  );
}
