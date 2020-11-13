import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { map } from "rxjs/operators";
import { Post } from './post.model';
import { Router } from "@angular/router";

@Injectable({providedIn: "root"})
export class PostService{

    private posts: Post[] = [];
    private postsUpdated = new Subject<{ posts: Post[]; postCount: number }>();

    constructor( private http: HttpClient, private router: Router){}

    getPosts(postsPerPage: number, currentPage: number){
        const queryParams = `?pagesize=${postsPerPage}&page=${currentPage}`;
            this.http
            .get<{ message: string; posts: any; maxPosts: number}>(
                "http://localhost:3000/api/posts" + queryParams)
            .pipe(
                map(postData=> {
                    return {
                        posts: postData.posts.map(post => {
                            return{
                                content: post.content,
                                id: post._id,
                                imagePath: post.imagePath,
                                creator: post.creator,
                                creatorUsername: post.creatorUsername
                            };
                        }),
                        maxPosts: postData.maxPosts
                    };
                })
            )
            .subscribe(transformedPostData =>{
                console.log(transformedPostData);
                this.posts = transformedPostData.posts;
                this.postsUpdated.next({
                    posts: [...this.posts],
                    postCount: transformedPostData.maxPosts
                });
            });
    }

    getPostUpdateListener(){
        return this.postsUpdated.asObservable();
    }

    getPost(id: string){
        return this.http.get<{_id: string; content: string; imagePath: string; creator: string; creatorUsername: string}>("http://localhost:3000/api/posts/" +id);
    }

    addPost(content: string, image: File){
        const postData = new FormData();
        postData.append("content", content);
        postData.append("image", image);
        this.http.post<{ message: string; post: Post}>( "http://localhost:3000/api/posts/", postData )
         .subscribe(responseData => {
            this.router.routeReuseStrategy.shouldReuseRoute = function () {
                return false;
            }
            this.router.onSameUrlNavigation = 'reload';
            this.router.navigate(["/feed-page"]);
         })
    }

    updatePost(id: string, content: string, image: File | string) {
        let postData: Post | FormData;
        if (typeof image === "object") {
          postData = new FormData();
          postData.append("id", id);
          postData.append("content", content);
          postData.append("image", image);
        } else {
          postData = {
            id: id,
            content: content,
            imagePath: image,
            creator: null,
            creatorUsername: null
          };
        }
        this.http
          .put("http://localhost:3000/api/posts/" + id, postData)
          .subscribe(response => {
            this.router.navigate(["/"]);
          });
      }

      deletePost(postId: string) {
        return this.http
          .delete("http://localhost:3000/api/posts/" + postId);
      }

}