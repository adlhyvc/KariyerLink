"use client";
import { fetcher } from "@/app/api/axiosInstance";
import PostList from "@/app/components/post-list";
import { Post, User } from "@/app/types";
import React from "react";
import useSWR from "swr";
import ProfileCard from "../components/profile-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import FollowerList from "../components/follower-list";
import FollowingList from "../components/following-list";
import { useTranslation } from "react-i18next";
import AboutSection from "../components/about-section";


export default function Page({ params }: { params: { id: string } }) {
  const { t } = useTranslation();
  const { data, isLoading, error, mutate } = useSWR<Post[]>(`/posts/posts/user/${params.id}`, fetcher);
  const { data: user, error: userError } = useSWR<User>(`/users/${params.id}`, fetcher);

  return (
    <div className="flex flex-row gap-6 w-full pt-24 px-8 lg:px-24 pb-12">
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        <ProfileCard id={params.id} user={user} error={userError} />
        <Tabs defaultValue="about" className="w-full">
          <TabsList className="w-full flex">
            <TabsTrigger value="posts" className="flex-1">
              {t("profilePage.postsTab")}
            </TabsTrigger>
            <TabsTrigger value="about" className="flex-1">
              {t("profilePage.aboutTab")}
            </TabsTrigger>
            <TabsTrigger value="followers" className="flex-1">
              {t("profilePage.followersTab")}
            </TabsTrigger>
            <TabsTrigger value="following" className="flex-1">
              {t("profilePage.followingTab")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="posts">
            <PostList mutate={mutate} data={data} isLoading={isLoading} error={error} />
          </TabsContent>
          <TabsContent value="about">
            <AboutSection user={user} />
          </TabsContent>
          <TabsContent value="followers">
            <FollowerList id={params.id} />
          </TabsContent>
          <TabsContent value="following">
            <FollowingList id={params.id} />
          </TabsContent>
        </Tabs>
      </div>

    </div>
  );
}
