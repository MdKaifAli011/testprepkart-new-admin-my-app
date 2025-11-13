import React from "react";
import MainLayout from "../../../../layouts/MainLayout";
import PracticeQuestionManagement from "../../../../components/features/PracticeQuestionManagement";

const PracticeSubCategoryPage = async ({ params }) => {
  const { subCategoryId } = await params;
  return (
    <MainLayout>
      <PracticeQuestionManagement subCategoryId={subCategoryId} />
    </MainLayout>
  );
};

export default PracticeSubCategoryPage;
